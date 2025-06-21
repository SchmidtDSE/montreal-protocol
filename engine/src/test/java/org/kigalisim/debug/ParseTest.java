package org.kigalisim.debug;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.kigalisim.KigaliSimFacade;
import org.kigalisim.lang.program.ParsedProgram;
import org.kigalisim.lang.program.ParsedPolicy;
import org.kigalisim.lang.program.ParsedApplication;
import org.kigalisim.lang.program.ParsedSubstance;
import org.kigalisim.lang.operation.Operation;
import org.kigalisim.lang.operation.SetOperation;
import org.kigalisim.lang.operation.EqualsOperation;

import java.io.IOException;

public class ParseTest {

  @Test
  public void testParsing() throws IOException {
    // Load and parse the QTA file
    String qtaPath = "/tmp/test_minimal_interpreter.qta";
    ParsedProgram program = KigaliSimFacade.parseAndInterpret(qtaPath);
    
    ParsedPolicy defaultPolicy = program.getPolicy("default");
    ParsedApplication application = defaultPolicy.getApplication("testApp");
    ParsedSubstance substance = application.getSubstance("testSubstance");
    
    int count = 0;
    boolean hasSetOperation = false;
    boolean hasEqualsOperation = false;
    
    for (Operation op : substance.getOperations()) {
      count++;
      System.out.println("Operation " + count + " type: " + op.getClass().getSimpleName());
      if (op instanceof SetOperation) {
        hasSetOperation = true;
      }
      if (op instanceof EqualsOperation) {
        hasEqualsOperation = true;
      }
    }
    System.out.println("Total number of operations: " + count);
    
    assertTrue(hasSetOperation, "Should have a SetOperation");
    assertTrue(hasEqualsOperation, "Should have an EqualsOperation");
    assertTrue(count >= 2, "Should have at least 2 operations");
  }
}