/**
 * Utility class for live tests using actual QTA files.
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.validate;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.kigalisim.KigaliSimFacade;
import org.kigalisim.engine.serializer.EngineResult;
import org.kigalisim.lang.program.ParsedProgram;

/**
 * Utility methods for tests that validate QTA files against expected behavior.
 */
public class LiveTestsUtil {

  /**
   * Utility function to get a result for a specific scenario, year, application, and substance.
   * Similar to the getResult function in test_compiler.js.
   *
   * @param results Stream of engine results from running a scenario
   * @param scenarioName The scenario name (not used in Java since we run one scenario at a time)
   * @param year The year to find results for
   * @param application The application name
   * @param substance The substance name
   * @return The matching EngineResult or null if not found
   */
  public static EngineResult getResult(Stream<EngineResult> results, String scenarioName, int year, 
      String application, String substance) {
    return results
        .filter(r -> r.getYear() == year)
        .filter(r -> r.getApplication().equals(application))
        .filter(r -> r.getSubstance().equals(substance))
        .findFirst()
        .orElse(null);
  }

  /**
   * Utility function to get a result for a specific year, application, and substance.
   * Simplified version when scenario name is not needed.
   *
   * @param results Stream of engine results
   * @param year The year to find results for
   * @param application The application name
   * @param substance The substance name
   * @return The matching EngineResult or null if not found
   */
  public static EngineResult getResult(Stream<EngineResult> results, int year, 
      String application, String substance) {
    return getResult(results, null, year, application, substance);
  }

  /**
   * Parses a QTA file and runs the specified scenario.
   *
   * @param qtaPath Path to the QTA file
   * @param scenarioName Name of the scenario to run
   * @return List of EngineResult objects from running the scenario
   * @throws IOException If there's an error reading the file
   */
  public static List<EngineResult> parseAndRunScenario(String qtaPath, String scenarioName) 
      throws IOException {
    ParsedProgram program = KigaliSimFacade.parseAndInterpret(qtaPath);
    Stream<EngineResult> results = KigaliSimFacade.runScenarioWithResults(program, scenarioName);
    return results.collect(Collectors.toList());
  }
}