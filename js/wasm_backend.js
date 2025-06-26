/**
 * WASM backend for executing QubecTalk simulations via WASM web worker.
 *
 * @license BSD, see LICENSE.md.
 */

import {EngineNumber} from "engine_number";
import {EngineResult, ImportSupplement} from "engine_struct";

/**
 * Parser for handling CSV report data returned from the WASM worker.
 * Uses the same parsing logic as the legacy backend.
 */
class ReportDataParser {
  /**
   * Parse the response from the WASM worker.
   *
   * @param {string} response - The response string from worker containing status and CSV data.
   * @returns {Array<EngineResult>} Parsed engine results.
   * @throws {Error} If response indicates an error status.
   */
  static parseResponse(response) {
    const lines = response.split("\n");

    if (lines.length < 2) {
      throw new Error("Invalid response format: missing status line or data");
    }

    const status = lines[0].trim();
    if (status !== "OK") {
      throw new Error(status);
    }

    // Skip empty line after status
    const csvData = lines.slice(2).join("\n").trim();

    if (!csvData) {
      return [];
    }

    // Check if we have only headers (for testing/placeholder mode)
    const csvLines = csvData.split("\n").filter((line) => line.trim());
    if (csvLines.length <= 1) {
      return []; // Only headers, no data
    }

    return ReportDataParser._parseCsvData(csvData);
  }

  /**
   * Parse CSV data into EngineResult objects.
   *
   * @private
   * @param {string} csvData - The CSV data to parse.
   * @returns {Array<EngineResult>} Array of parsed engine results.
   */
  static _parseCsvData(csvData) {
    const lines = csvData.split("\n");
    const filteredLines = [];
    
    // Filter non-empty lines in single pass (avoid filter + trim chain)
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed) {
        filteredLines.push(trimmed);
      }
    }

    if (filteredLines.length === 0) {
      return [];
    }

    // Parse header with single split, trim in place (avoid map chain)
    const headerLine = filteredLines[0];
    const headers = headerLine.split(",");
    const headerCount = headers.length;
    
    for (let i = 0; i < headerCount; i++) {
      headers[i] = headers[i].trim();
    }
    
    // Pre-calculate header indices for direct access
    const headerIndices = {};
    for (let i = 0; i < headerCount; i++) {
      headerIndices[headers[i]] = i;
    }

    const results = [];

    for (let i = 1; i < filteredLines.length; i++) {
      const line = filteredLines[i];
      const values = line.split(",");

      if (values.length !== headerCount) {
        continue; // Skip malformed rows
      }

      // Trim values in place (avoid map chain)
      for (let j = 0; j < values.length; j++) {
        values[j] = values[j].trim();
      }

      try {
        // Pass values array and indices instead of creating intermediate object
        const engineResult = ReportDataParser._createEngineResult(values, headerIndices);
        results.push(engineResult);
      } catch (e) {
        console.warn("Failed to parse row:", values, e);
        // Continue parsing other rows
      }
    }

    return results;
  }


  /**
   * Create an EngineResult from a parsed CSV row.
   *
   * @private
   * @param {Array<string>} values - The parsed CSV row values.
   * @param {Object} headerIndices - Map of header names to array indices.
   * @returns {EngineResult} The created engine result.
   */
  static _createEngineResult(values, headerIndices) {
    // Helper function to parse Java EngineNumber.toString() format: "value units"
    const parseEngineNumber = (valueStr, defaultUnits) => {
      if (!valueStr) {
        return new EngineNumber(0, defaultUnits);
      }
      
      // Find first space character instead of using regex split
      const spaceIndex = valueStr.indexOf(" ");
      if (spaceIndex === -1) {
        // Only value, use default units
        const value = parseFloat(valueStr) || 0;
        return new EngineNumber(value, defaultUnits);
      } else {
        // Format: "value units"
        const value = parseFloat(valueStr.substring(0, spaceIndex)) || 0;
        const units = valueStr.substring(spaceIndex + 1); // Get units after space
        return new EngineNumber(value, units);
      }
    };

    // Direct array access using pre-calculated indices (avoid object creation)
    const getValue = (field) => values[headerIndices[field]] || "";
    
    // Extract fields matching Java CSV format
    const application = getValue("application");
    const substance = getValue("substance");
    const year = parseInt(getValue("year")) || 0;
    const scenarioName = getValue("scenario"); // Java uses "scenario", not "scenarioName"
    const trialNumber = parseInt(getValue("trial")) || 0; // Java uses "trial", not "trialNumber"

    // Parse EngineNumber fields from Java's "value units" format
    const manufactureValue = parseEngineNumber(getValue("manufacture"), "kg");
    const importValue = parseEngineNumber(getValue("import"), "kg");
    const recycleValue = parseEngineNumber(getValue("recycle"), "kg");
    const domesticConsumptionValue = parseEngineNumber(getValue("domesticConsumption"), "tCO2e");
    const importConsumptionValue = parseEngineNumber(getValue("importConsumption"), "tCO2e");
    const recycleConsumptionValue = parseEngineNumber(getValue("recycleConsumption"), "tCO2e");
    const populationValue = parseEngineNumber(getValue("population"), "units");
    const populationNew = parseEngineNumber(getValue("populationNew"), "units");
    const rechargeEmissions = parseEngineNumber(getValue("rechargeEmissions"), "tCO2e");
    const eolEmissions = parseEngineNumber(getValue("eolEmissions"), "tCO2e");
    const energyConsumption = parseEngineNumber(getValue("energyConsumption"), "kwh");

    // Handle importSupplement fields from Java CSV
    const initialChargeValue = parseEngineNumber(getValue("initialChargeValue"), "kg");
    const initialChargeConsumption = parseEngineNumber(getValue("initialChargeConsumption"), "tCO2e");
    const importNewPopulation = parseEngineNumber(getValue("importNewPopulation"), "units");

    // Create importSupplement object using the proper ImportSupplement class
    const importSupplement = new ImportSupplement(
      initialChargeValue,
      initialChargeConsumption,
      importNewPopulation,
    );

    return new EngineResult(
      application,
      substance,
      year,
      scenarioName,
      trialNumber,
      manufactureValue,
      importValue,
      recycleValue,
      domesticConsumptionValue,
      importConsumptionValue,
      recycleConsumptionValue,
      populationValue,
      populationNew,
      rechargeEmissions,
      eolEmissions,
      energyConsumption,
      importSupplement,
    );
  }
}

/**
 * Web worker layer for managing communication with the WASM execution worker.
 */
class WasmLayer {
  /**
   * Create a new WasmLayer instance.
   */
  constructor() {
    const self = this;
    self._worker = null;
    self._initPromise = null;
    self._pendingRequests = new Map();
    self._nextRequestId = 1;
  }

  /**
   * Initialize the worker and prepare for execution.
   *
   * @returns {Promise<void>} Promise that resolves when worker is ready.
   */
  initialize() {
    const self = this;

    if (self._initPromise !== null) {
      return self._initPromise;
    }

    self._initPromise = new Promise((resolve, reject) => {
      try {
        self._worker = new Worker("/js/wasm.worker.js?v=EPOCH");

        self._worker.onmessage = (event) => {
          self._handleWorkerMessage(event);
        };

        self._worker.onerror = (error) => {
          console.error("WASM Worker error:", error);
          reject(new Error("WASM Worker failed to load: " + error.message));
        };

        // Worker is ready immediately - WASM initialization happens inside worker
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    return self._initPromise;
  }

  /**
   * Execute QubecTalk code and return parsed results.
   *
   * @param {string} code - The QubecTalk code to execute.
   * @returns {Promise<Array<EngineResult>>} Promise resolving to execution results.
   */
  async runSimulation(code) {
    const self = this;

    await self.initialize();

    return new Promise((resolve, reject) => {
      const requestId = self._nextRequestId++;

      self._pendingRequests.set(requestId, {resolve, reject});

      self._worker.postMessage({
        id: requestId,
        command: "execute",
        code: code,
      });

      // Set timeout for long-running simulations
      setTimeout(() => {
        if (self._pendingRequests.has(requestId)) {
          self._pendingRequests.delete(requestId);
          reject(new Error("Simulation timeout"));
        }
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Handle messages from the worker.
   *
   * @private
   * @param {MessageEvent} event - The message event from worker.
   */
  _handleWorkerMessage(event) {
    const self = this;
    const {id, success, result, error} = event.data;

    const request = self._pendingRequests.get(id);
    if (!request) {
      console.warn("Received response for unknown request:", id);
      return;
    }

    self._pendingRequests.delete(id);

    if (success) {
      try {
        const parsedResults = ReportDataParser.parseResponse(result);
        request.resolve(parsedResults);
      } catch (parseError) {
        request.reject(parseError);
      }
    } else {
      request.reject(new Error(error || "Unknown WASM worker error"));
    }
  }

  /**
   * Terminate the worker and clean up resources.
   */
  terminate() {
    const self = this;

    if (self._worker) {
      self._worker.terminate();
      self._worker = null;
    }

    // Reject any pending requests
    for (const [id, request] of self._pendingRequests) {
      request.reject(new Error("WASM Worker terminated"));
    }
    self._pendingRequests.clear();

    self._initPromise = null;
  }
}

/**
 * WASM backend for executing QubecTalk simulations.
 *
 * This backend executes QubecTalk code in a WASM web worker for high-performance
 * execution and returns the results as parsed EngineResult objects.
 */
class WasmBackend {
  /**
   * Create a new WasmBackend instance.
   *
   * @param {WasmLayer} wasmLayer - The layer for worker communication.
   */
  constructor(wasmLayer) {
    const self = this;
    self._wasmLayer = wasmLayer;
  }

  /**
   * Execute QubecTalk simulation code.
   *
   * @param {string} simCode - The QubecTalk code to execute.
   * @returns {Promise<Array<EngineResult>>} Promise resolving to simulation results.
   */
  async execute(simCode) {
    const self = this;

    try {
      const results = await self._wasmLayer.runSimulation(simCode);
      return results;
    } catch (error) {
      throw new Error("WASM simulation execution failed: " + error.message);
    }
  }
}

export {WasmBackend, WasmLayer, ReportDataParser};
