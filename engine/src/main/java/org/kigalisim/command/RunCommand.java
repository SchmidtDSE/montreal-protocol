/**
 * Command to run a QubecTalk simulation from a QTA file.
 *
 * <p>This command takes a QTA file path as input and executes the simulation,
 * displaying the results to the console.</p>
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.command;

import java.io.IOException;
import java.util.List;
import org.kigalisim.KigaliSimFacade;
import org.kigalisim.engine.serializer.EngineResult;
import picocli.CommandLine.Command;
import picocli.CommandLine.Parameters;

/**
 * Command to run QubecTalk simulations from QTA files.
 */
@Command(
    name = "run",
    description = "Run a QubecTalk simulation from a QTA file",
    mixinStandardHelpOptions = true
)
public class RunCommand implements Runnable {

  @Parameters(index = "0", description = "Path to the QTA file to execute")
  private String qtaFilePath;

  @Override
  public void run() {
    try {
      KigaliSimFacade facade = new KigaliSimFacade();
      List<List<EngineResult>> results = facade.interpret(qtaFilePath);

      System.out.println("Simulation completed successfully.");
      System.out.println("Results:");

      for (int simIndex = 0; simIndex < results.size(); simIndex++) {
        List<EngineResult> simulationResults = results.get(simIndex);
        System.out.println("Simulation " + (simIndex + 1) + ":");

        for (EngineResult result : simulationResults) {
          System.out.printf("  Year %d - %s/%s: Manufacture=%.2f mt%n",
              result.getYear(),
              result.getApplication(),
              result.getSubstance(),
              result.getManufacture().getValue().doubleValue());
        }
      }

    } catch (IOException e) {
      System.err.println("Error reading QTA file: " + e.getMessage());
      System.exit(1);
    } catch (Exception e) {
      System.err.println("Error running simulation: " + e.getMessage());
      System.exit(1);
    }
  }
}
