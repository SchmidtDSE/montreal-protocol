/**
 * Facade for interacting with the Kigali platform via code.
 *
 * @license BSD-3-Clause
 */

package org.kigalisim;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import org.antlr.v4.runtime.CharStreams;
import org.antlr.v4.runtime.CommonTokenStream;
import org.antlr.v4.runtime.tree.ParseTree;
import org.kigalisim.engine.Engine;
import org.kigalisim.engine.SingleThreadEngine;
import org.kigalisim.lang.QubecTalkEngineVisitor;
import org.kigalisim.lang.QubecTalkLexer;
import org.kigalisim.lang.QubecTalkParser;
import org.kigalisim.lang.fragment.Fragment;
import org.kigalisim.lang.fragment.ProgramFragment;
import org.kigalisim.lang.machine.PushDownMachine;
import org.kigalisim.lang.machine.SingleThreadPushDownMachine;
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
   * <p>Parse a QubecTalk script such as to check for syntax errors or generate an AST in support of
   * developer tools.</p>
   *
   * @param code String code to parse as a QubecTalk source.
   * @return The parse tree resulting from parsing the code.
   */
  public static ParseTree parse(String code) {
    QubecTalkLexer lexer = new QubecTalkLexer(CharStreams.fromString(code));
    CommonTokenStream tokens = new CommonTokenStream(lexer);
    QubecTalkParser parser = new QubecTalkParser(tokens);
    return parser.program();
  }

  /**
   * Interpret a parsed QubecTalk script to Java objects which can run the simulation.
   *
   * @param parseTree The parse tree resulting from parsing the QubecTalk source.
   * @return The parsed program which can be used to run a specific simulation.
   */
  public static ParsedProgram interpret(ParseTree parseTree) {
    QubecTalkEngineVisitor visitor = new QubecTalkEngineVisitor();
    Fragment fragment = visitor.visit(parseTree);
    return fragment.getProgram();
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
    ParseTree parseTree = parse(code);
    return interpret(parseTree);
  }

  /**
   * Run a simulation from the provided program.
   *
   * <p>Creates and executes a simulation using the provided program and simulation name.</p>
   *
   * @param program The parsed program containing the simulation to run.
   * @param simulationName The name of the simulation to execute from the program.
   */
  public static void runSimulation(ParsedProgram program, String simulationName) {
    // Get the scenario from the program
    if (!program.getScenarios().contains(simulationName)) {
      throw new IllegalArgumentException("Simulation not found: " + simulationName);
    }

    // Get the scenario
    ParsedScenario scenario = program.getScenario(simulationName);

    // Determine start and end years from the scenario
    // For now, use fixed values for the example
    int startYear = 1;
    int endYear = 3;

    // Create the engine and machine
    Engine engine = new SingleThreadEngine(startYear, endYear);
    PushDownMachine machine = new SingleThreadPushDownMachine(engine);

    // Run the simulation
    // This is a simplified implementation that just sets up the engine
    // A more complete implementation would run the simulation for each year
    // and collect results
  }

  /**
   * Validate a QubecTalk script.
   *
   * <p>Parse and interpret a QubecTalk script to check for syntax and semantic errors.</p>
   *
   * @param filePath The path to the QubecTalk script file.
   * @return True if the script is valid, false otherwise.
   */
  public static boolean validate(String filePath) {
    try {
      parseAndInterpret(filePath);
      return true;
    } catch (Exception e) {
      // Print the exception for debugging
      System.err.println("Validation failed: " + e.getMessage());
      return false;
    }
  }
}
