/**
 * Facade for running QubecTalk simulations from the command line.
 *
 * @license BSD-3-Clause
 */

package org.kigalisim;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.antlr.v4.runtime.CharStreams;
import org.antlr.v4.runtime.CommonTokenStream;
import org.antlr.v4.runtime.tree.ParseTree;
import org.kigalisim.engine.serializer.EngineResult;
import org.kigalisim.lang.QubecTalkEngineVisitor;
import org.kigalisim.lang.QubecTalkLexer;
import org.kigalisim.lang.QubecTalkParser;
import org.kigalisim.lang.fragment.Fragment;
import org.kigalisim.lang.fragment.ProgramFragment;


/**
 * Facade for running QubecTalk simulations.
 *
 * <p>Entry point for running QubecTalk simulations from Java, providing methods to interpret
 * QubecTalk files and execute simulations.</p>
 */
public class KigaliSimFacade {

  /**
   * Interpret and run a QubecTalk program from a file path.
   *
   * @param filePath The path to the QubecTalk (.qta) file
   * @return List of engine results from the simulation
   * @throws IOException if the file cannot be read
   * @throws IllegalArgumentException if the QubecTalk code has errors
   */
  public List<List<EngineResult>> interpret(String filePath) throws IOException {
    String content = Files.readString(Path.of(filePath));
    return interpretContent(content);
  }

  /**
   * Interpret and run QubecTalk program content.
   *
   * @param content The QubecTalk program content
   * @return List of engine results from the simulation
   * @throws IllegalArgumentException if the QubecTalk code has errors
   */
  public List<List<EngineResult>> interpretContent(String content) {
    // Parse the QubecTalk content
    QubecTalkLexer lexer = new QubecTalkLexer(CharStreams.fromString(content));
    CommonTokenStream tokens = new CommonTokenStream(lexer);
    QubecTalkParser parser = new QubecTalkParser(tokens);

    ParseTree tree = parser.program();

    // Visit the parse tree to build the program
    QubecTalkEngineVisitor visitor = new QubecTalkEngineVisitor();
    Fragment programFragment = visitor.visit(tree);

    if (!(programFragment instanceof ProgramFragment)) {
      throw new IllegalArgumentException("Failed to parse QubecTalk program");
    }

    ProgramFragment program = (ProgramFragment) programFragment;

    // Execute the program
    return program.execute();
  }
}
