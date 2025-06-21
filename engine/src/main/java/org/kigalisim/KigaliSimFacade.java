/**
 * Facade for interacting with the Kigali platform via code.
 *
 * @license BSD-3-Clause
 */

package org.kigalisim;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import org.kigalisim.engine.Engine;
import org.kigalisim.engine.SingleThreadEngine;
import org.kigalisim.lang.interpret.QubecTalkInterpreter;
import org.kigalisim.lang.machine.PushDownMachine;
import org.kigalisim.lang.machine.SingleThreadPushDownMachine;
import org.kigalisim.lang.parse.ParseResult;
import org.kigalisim.lang.parse.QubecTalkParser;
import org.kigalisim.lang.program.ParsedProgram;
import org.kigalisim.lang.program.ParsedScenario;

/**
 * Entry point into the Kigali platform when used as a library.
 *
 * <p>Facade which helps facilitate common operations within the Kigali simulation platform when used
 * as a library as opposed to as an interactive / command-line tool.</p>
 */
public class KigaliSimFacade {

  /**
   * Parse a QubecTalk script.
   *
   * @param code String code to parse as a QubecTalk source.
   * @return The parse result containing either the parse tree or errors.
   */
  public static ParseResult parse(String code) {
    QubecTalkParser parser = new QubecTalkParser();
    return parser.parse(code);
  }

  /**
   * Interpret a parsed QubecTalk script to Java objects which can run the simulation.
   *
   * @param parseResult The parse result from parsing the QubecTalk source.
   * @return The parsed program which can be used to run a specific simulation.
   */
  public static ParsedProgram interpret(ParseResult parseResult) {
    QubecTalkInterpreter interpreter = new QubecTalkInterpreter();
    return interpreter.interpret(parseResult);
  }

  /**
   * Parse and interpret a QubecTalk script from a file.
   *
   * @param filePath The path to the QubecTalk script file.
   * @return The parsed program which can be used to run a specific simulation.
   * @throws IOException If there is an error reading the file.
   */
  public static ParsedProgram parseAndInterpret(String filePath) throws IOException {
    String code = new String(Files.readAllBytes(Paths.get(filePath)));
    ParseResult parseResult = parse(code);
    return interpret(parseResult);
  }

  /**
   * Run a simulation from the provided program.
   *
   * <p>Creates and executes a simulation using the provided program and simulation name where this
   * name refers to a scenario indicating the set of policies to be stacked.</p>
   *
   * @param program The parsed program containing the simulation to run.
   * @param scenarioName The name of the simulation to execute from the program.
   */
  public static void runSimulation(ParsedProgram program, String scenarioName) {
    // Get the scenario from the program
    if (!program.getScenarios().contains(scenarioName)) {
      throw new IllegalArgumentException("Scenario not found: " + scenarioName);
    }

    // Get the scenario
    ParsedScenario scenario = program.getScenario(scenarioName);

    // TODO: This is temporary
    // Determine start and end years from the scenario
    // For now, use fixed values for the example
    int startYear = 1;
    int endYear = 3;

    // Create the engine and machine
    Engine engine = new SingleThreadEngine(startYear, endYear);
    PushDownMachine machine = new SingleThreadPushDownMachine(engine);

    // TODO: This is temporary
    // Run the simulation
    // This is a simplified implementation that just sets up the engine
    // A more complete implementation would run the simulation for each year
    // and collect results
  }

  /**
   * Validate a QubecTalk script.
   *
   * <p>Parse and interpret a QubecTalk script to check for syntax errors.</p>
   *
   * @param filePath The path to the QubecTalk script file.
   * @return True if the script is valid, false otherwise.
   */
  public static boolean validate(String filePath) {
    try {
      String code = new String(Files.readAllBytes(Paths.get(filePath)));
      ParseResult parseResult = parse(code);

      if (parseResult.hasErrors()) {
        System.err.println("Validation failed: Parse errors detected");
        return false;
      }

      interpret(parseResult);
      return true;
    } catch (Exception e) {
      // Print the exception for debugging
      System.err.println("Validation failed: " + e.getMessage());
      return false;
    }
  }
}
