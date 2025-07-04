/**
 * WASM backend for executing QubecTalk simulations via WASM web worker.
 *
 * @license BSD, see LICENSE.md.
 */

import {EngineNumber} from "engine_number";
import {EngineResult, TradeSupplement} from "engine_struct";

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
    const lines = csvData.split("\n").filter((line) => line.trim());

    if (lines.length === 0) {
      return [];
    }

    // Parse header to understand column structure
    const headers = lines[0].split(",").map((h) => h.trim());
    const results = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());

      if (values.length !== headers.length) {
        continue; // Skip malformed rows
      }

      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      try {
        const engineResult = ReportDataParser._createEngineResult(row);
        results.push(engineResult);
      } catch (e) {
        console.warn("Failed to parse row:", row, e);
        // Continue parsing other rows
      }
    }

    return results;
  }

  /**
   * Create an EngineResult from a parsed CSV row.
   *
   * @private
   * @param {Object} row - The parsed CSV row data.
   * @returns {EngineResult} The created engine result.
   */
  static _createEngineResult(row) {
    // Helper function to parse Java EngineNumber.toString() format: "value units"
    const parseEngineNumber = (valueStr, defaultUnits = "units") => {
      if (!valueStr || valueStr.trim() === "") {
        return new EngineNumber(0, defaultUnits);
      }
      const parts = valueStr.trim().split(/\s+/);
      if (parts.length >= 2) {
        // Format: "value units"
        const value = parseFloat(parts[0]) || 0;
        const units = parts.slice(1).join(" "); // Handle multi-word units
        return new EngineNumber(value, units);
      } else {
        // Only value, use default units
        const value = parseFloat(parts[0]) || 0;
        return new EngineNumber(value, defaultUnits);
      }
    };

    // Extract fields matching Java CSV format
    const application = row["application"] || "";
    const substance = row["substance"] || "";
    const year = parseInt(row["year"] || "0");
    const scenarioName = row["scenario"] || ""; // Java uses "scenario", not "scenarioName"
    const trialNumber = parseInt(row["trial"] || "0"); // Java uses "trial", not "trialNumber"

    // Parse EngineNumber fields from Java's "value units" format
    const manufactureValue = parseEngineNumber(row["manufacture"], "kg");
    const importValue = parseEngineNumber(row["import"], "kg");
    const exportValue = parseEngineNumber(row["export"], "kg");
    const recycleValue = parseEngineNumber(row["recycle"], "kg");
    const domesticConsumptionValue = parseEngineNumber(row["domesticConsumption"], "tCO2e");
    const importConsumptionValue = parseEngineNumber(row["importConsumption"], "tCO2e");
    const exportConsumptionValue = parseEngineNumber(row["exportConsumption"], "tCO2e");
    const recycleConsumptionValue = parseEngineNumber(row["recycleConsumption"], "tCO2e");
    const populationValue = parseEngineNumber(row["population"], "units");
    const populationNew = parseEngineNumber(row["populationNew"], "units");
    const rechargeEmissions = parseEngineNumber(row["rechargeEmissions"], "tCO2e");
    const eolEmissions = parseEngineNumber(row["eolEmissions"], "tCO2e");
    const energyConsumption = parseEngineNumber(row["energyConsumption"], "kwh");

    // Handle TradeSupplement fields from Java CSV
    const importInitialChargeValue = parseEngineNumber(
      row["importInitialChargeValue"],
      "kg",
    );
    const importInitialChargeConsumption = parseEngineNumber(
      row["importInitialChargeConsumption"],
      "tCO2e",
    );
    const importPopulation = parseEngineNumber(row["importPopulation"], "units");
    const exportInitialChargeValue = parseEngineNumber(
      row["exportInitialChargeValue"],
      "kg",
    );
    const exportInitialChargeConsumption = parseEngineNumber(
      row["exportInitialChargeConsumption"],
      "tCO2e",
    );

    // Create tradeSupplement object using the TradeSupplement class
    const tradeSupplement = new TradeSupplement(
      importInitialChargeValue,
      importInitialChargeConsumption,
      importPopulation,
      exportInitialChargeValue,
      exportInitialChargeConsumption,
    );

    return new EngineResult(
      application,
      substance,
      year,
      scenarioName,
      trialNumber,
      manufactureValue,
      importValue,
      exportValue,
      recycleValue,
      domesticConsumptionValue,
      importConsumptionValue,
      exportConsumptionValue,
      recycleConsumptionValue,
      populationValue,
      populationNew,
      rechargeEmissions,
      eolEmissions,
      energyConsumption,
      tradeSupplement,
    );
  }
}

/**
 * Web worker layer for managing communication with the WASM execution worker.
 */
class WasmLayer {
  /**
   * Create a new WasmLayer instance.
   *
   * @param {Function} reportProgressCallback - Callback for progress updates.
   */
  constructor(reportProgressCallback) {
    const self = this;
    self._worker = null;
    self._initPromise = null;
    self._pendingRequests = new Map();
    self._nextRequestId = 1;
    self._reportProgressCallback = reportProgressCallback;
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
   * Execute QubecTalk code and return backend result.
   *
   * @param {string} code - The QubecTalk code to execute.
   * @returns {Promise<BackendResult>} Promise resolving to backend result with CSV and parsed data.
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
    const {resultType, id, success, result, error, progress} = event.data;

    // Handle progress messages
    if (resultType === "progress") {
      if (self._reportProgressCallback) {
        self._reportProgressCallback(progress);
      }
      return;
    }

    // Handle regular result messages
    const request = self._pendingRequests.get(id);
    if (!request) {
      console.warn("Received response for unknown request:", id);
      return;
    }

    self._pendingRequests.delete(id);

    if (success) {
      try {
        const parsedResults = ReportDataParser.parseResponse(result);

        // Extract CSV string from the response
        // The response format is "OK\n\n<CSV_DATA>"
        const lines = result.split("\n");
        const csvString = lines.slice(2).join("\n").trim();

        // Create BackendResult with both CSV and parsed data
        const backendResult = new BackendResult(csvString, parsedResults);
        request.resolve(backendResult);
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
   * @param {Function} reportProgressCallback - Callback for progress updates.
   */
  constructor(wasmLayer, reportProgressCallback) {
    const self = this;
    self._wasmLayer = wasmLayer;
    self._reportProgressCallback = reportProgressCallback;

    // Set the progress callback on the WASM layer
    if (self._wasmLayer && reportProgressCallback) {
      self._wasmLayer._reportProgressCallback = reportProgressCallback;
    }
  }

  /**
   * Execute QubecTalk simulation code.
   *
   * @param {string} simCode - The QubecTalk code to execute.
   * @returns {Promise<BackendResult>} Promise resolving to backend result with CSV and parsed data.
   */
  async execute(simCode) {
    const self = this;

    try {
      const backendResult = await self._wasmLayer.runSimulation(simCode);
      return backendResult;
    } catch (error) {
      throw new Error("WASM simulation execution failed: " + error.message);
    }
  }
}

/**
 * Result object containing both CSV string and parsed results from backend execution.
 */
class BackendResult {
  /**
   * Create a new BackendResult instance.
   *
   * @param {string} csvString - The raw CSV string from the backend.
   * @param {Array<EngineResult>} parsedResults - The parsed engine results.
   */
  constructor(csvString, parsedResults) {
    const self = this;
    self._csvString = csvString;
    self._parsedResults = parsedResults;
  }

  /**
   * Get the raw CSV string from the backend.
   *
   * @returns {string} The CSV string.
   */
  getCsvString() {
    const self = this;
    return self._csvString;
  }

  /**
   * Get the parsed results array.
   *
   * @returns {Array<EngineResult>} The parsed engine results.
   */
  getParsedResults() {
    const self = this;
    return self._parsedResults;
  }
}

export {WasmBackend, WasmLayer, ReportDataParser, BackendResult};
