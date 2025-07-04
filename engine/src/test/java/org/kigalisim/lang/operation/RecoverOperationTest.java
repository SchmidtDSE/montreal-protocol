/**
 * Unit tests for the RecoverOperation class.
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.lang.operation;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.kigalisim.engine.Engine;
import org.kigalisim.engine.SingleThreadEngine;
import org.kigalisim.engine.number.EngineNumber;
import org.kigalisim.engine.state.YearMatcher;
import org.kigalisim.lang.machine.PushDownMachine;
import org.kigalisim.lang.machine.SingleThreadPushDownMachine;
import org.kigalisim.lang.time.CalculatedTimePointFuture;
import org.kigalisim.lang.time.ParsedDuring;
import org.kigalisim.lang.time.TimePointFuture;

/**
 * Tests for the RecoverOperation class.
 */
public class RecoverOperationTest {

  private Engine engine;
  private PushDownMachine machine;
  private YearMatcher allYearsMatcher;

  /**
   * Set up a new engine and machine before each test.
   */
  @BeforeEach
  public void setUp() {
    engine = new SingleThreadEngine(2020, 2025);
    machine = new SingleThreadPushDownMachine(engine);

    // Set up the engine with a scope
    engine.setStanza("default");
    engine.setApplication("test app");
    engine.setSubstance("test substance");

    // Create a matcher that matches all years
    allYearsMatcher = YearMatcher.unbounded();
  }

  /**
   * Test that RecoverOperation can be initialized with no during and no displacement.
   */
  @Test
  public void testInitializesNoDuringNoDisplacement() {
    EngineNumber volume = new EngineNumber(BigDecimal.valueOf(100), "kg");
    Operation volumeOperation = new PreCalculatedOperation(volume);

    EngineNumber yield = new EngineNumber(BigDecimal.valueOf(100), "%");
    Operation yieldOperation = new PreCalculatedOperation(yield);

    RecoverOperation operation = new RecoverOperation(volumeOperation, yieldOperation);
    assertNotNull(operation, "RecoverOperation should be constructable without during and displacement");
  }

  /**
   * Test that RecoverOperation can be initialized with a during but no displacement.
   */
  @Test
  public void testInitializesWithDuringNoDisplacement() {
    EngineNumber volume = new EngineNumber(BigDecimal.valueOf(100), "kg");
    Operation volumeOperation = new PreCalculatedOperation(volume);

    EngineNumber yield = new EngineNumber(BigDecimal.valueOf(100), "%");
    Operation yieldOperation = new PreCalculatedOperation(yield);

    ParsedDuring during = new ParsedDuring(Optional.empty(), Optional.empty());
    RecoverOperation operation = new RecoverOperation(volumeOperation, yieldOperation, during);
    assertNotNull(operation, "RecoverOperation should be constructable with during but no displacement");
  }


  /**
   * Test the execute method with no during and no displacement.
   */
  @Test
  public void testExecuteNoDuringNoDisplacement() {
    // Create a mock engine to verify the recycle method is called with the correct parameters
    Engine mockEngine = mock(Engine.class);
    PushDownMachine mockMachine = mock(PushDownMachine.class);
    when(mockMachine.getEngine()).thenReturn(mockEngine);

    // Set up recovery volume and yield
    EngineNumber volume = new EngineNumber(BigDecimal.valueOf(100), "kg");
    Operation volumeOperation = new PreCalculatedOperation(volume);

    EngineNumber yield = new EngineNumber(BigDecimal.valueOf(100), "%");
    Operation yieldOperation = new PreCalculatedOperation(yield);

    // Set up the mock machine to return the correct values
    when(mockMachine.getResult()).thenReturn(volume, yield);

    RecoverOperation operation = new RecoverOperation(volumeOperation, yieldOperation);

    operation.execute(mockMachine);

    // Verify the recycle method was called with the correct parameters
    verify(mockEngine).recycle(eq(volume), eq(yield), any(YearMatcher.class));
  }

  /**
   * Test the execute method with a during but no displacement.
   */
  @Test
  public void testExecuteWithDuringNoDisplacement() {
    // Set up recovery volume and yield
    EngineNumber volume = new EngineNumber(BigDecimal.valueOf(100), "kg");
    Operation volumeOperation = new PreCalculatedOperation(volume);

    EngineNumber yield = new EngineNumber(BigDecimal.valueOf(100), "%");
    Operation yieldOperation = new PreCalculatedOperation(yield);

    // Set up during
    EngineNumber yearNumber = new EngineNumber(BigDecimal.valueOf(2020), "");
    Operation yearOperation = new PreCalculatedOperation(yearNumber);
    TimePointFuture start = new CalculatedTimePointFuture(yearOperation);
    ParsedDuring during = new ParsedDuring(Optional.of(start), Optional.empty());

    RecoverOperation operation = new RecoverOperation(volumeOperation, yieldOperation, during);

    operation.execute(machine);

    // Since we can't directly verify the recycle method was called with the correct parameters
    // in a real engine, we'll just assert that the test completes without throwing an exception
    assertNotNull(operation, "RecoverOperation should execute without throwing an exception");
  }


  /**
   * Test the execute method with complex value operations.
   */
  @Test
  public void testExecuteWithComplexValueOperations() {
    // Create a mock engine to verify the recycle method is called with the correct parameters
    Engine mockEngine = mock(Engine.class);
    PushDownMachine mockMachine = mock(PushDownMachine.class);
    when(mockMachine.getEngine()).thenReturn(mockEngine);

    // Set up recovery volume with a complex operation
    Operation left = new PreCalculatedOperation(new EngineNumber(BigDecimal.valueOf(60), "kg"));
    Operation right = new PreCalculatedOperation(new EngineNumber(BigDecimal.valueOf(40), "kg"));
    Operation volumeOperation = new AdditionOperation(left, right); // 60 + 40 = 100 kg

    // Set up yield with a complex operation
    Operation leftYield = new PreCalculatedOperation(new EngineNumber(BigDecimal.valueOf(60), "%"));
    Operation rightYield = new PreCalculatedOperation(new EngineNumber(BigDecimal.valueOf(40), "%"));
    Operation yieldOperation = new AdditionOperation(leftYield, rightYield); // 60% + 40% = 100%

    // Set up the mock machine to return the correct values
    EngineNumber volume = new EngineNumber(BigDecimal.valueOf(100), "kg");
    EngineNumber yield = new EngineNumber(BigDecimal.valueOf(100), "%");
    when(mockMachine.getResult()).thenReturn(volume, yield);

    RecoverOperation operation = new RecoverOperation(volumeOperation, yieldOperation);

    operation.execute(mockMachine);

    // Verify the recycle method was called with the correct parameters
    verify(mockEngine).recycle(eq(volume), eq(yield), any(YearMatcher.class));
  }

  /**
   * Test that RecoverOperation can be initialized with displacement but no during.
   */
  @Test
  public void testInitializesWithDisplacementNoDuring() {
    EngineNumber volume = new EngineNumber(BigDecimal.valueOf(100), "kg");
    Operation volumeOperation = new PreCalculatedOperation(volume);

    EngineNumber yield = new EngineNumber(BigDecimal.valueOf(100), "%");
    Operation yieldOperation = new PreCalculatedOperation(yield);

    String displaceTarget = "sales";
    RecoverOperation operation = new RecoverOperation(volumeOperation, yieldOperation, displaceTarget);
    assertNotNull(operation, "RecoverOperation should be constructable with displacement but no during");
  }

  /**
   * Test that RecoverOperation can be initialized with both displacement and during.
   */
  @Test
  public void testInitializesWithDisplacementAndDuring() {
    EngineNumber volume = new EngineNumber(BigDecimal.valueOf(100), "kg");
    Operation volumeOperation = new PreCalculatedOperation(volume);

    EngineNumber yield = new EngineNumber(BigDecimal.valueOf(100), "%");
    Operation yieldOperation = new PreCalculatedOperation(yield);

    String displaceTarget = "R-404A";
    ParsedDuring during = new ParsedDuring(Optional.empty(), Optional.empty());
    RecoverOperation operation = new RecoverOperation(volumeOperation, yieldOperation, displaceTarget, during);
    assertNotNull(operation, "RecoverOperation should be constructable with both displacement and during");
  }

  /**
   * Test the execute method with displacement to a stream.
   */
  @Test
  public void testExecuteWithStreamDisplacement() {
    // Create a mock engine to verify the recycle method is called with displacement
    Engine mockEngine = mock(Engine.class);
    PushDownMachine mockMachine = mock(PushDownMachine.class);
    when(mockMachine.getEngine()).thenReturn(mockEngine);

    // Set up recovery volume and yield
    EngineNumber volume = new EngineNumber(BigDecimal.valueOf(50), "kg");
    Operation volumeOperation = new PreCalculatedOperation(volume);

    EngineNumber yield = new EngineNumber(BigDecimal.valueOf(100), "%");
    Operation yieldOperation = new PreCalculatedOperation(yield);

    // Set up the mock machine to return the correct values
    when(mockMachine.getResult()).thenReturn(volume, yield);

    String displaceTarget = "sales";
    RecoverOperation operation = new RecoverOperation(volumeOperation, yieldOperation, displaceTarget);

    operation.execute(mockMachine);

    // Verify the recycle method was called with displacement parameter
    verify(mockEngine).recycle(eq(volume), eq(yield), any(YearMatcher.class), eq(displaceTarget));
  }

  /**
   * Test the execute method with displacement to a substance.
   */
  @Test
  public void testExecuteWithSubstanceDisplacement() {
    // Create a mock engine to verify the recycle method is called with displacement
    Engine mockEngine = mock(Engine.class);
    PushDownMachine mockMachine = mock(PushDownMachine.class);
    when(mockMachine.getEngine()).thenReturn(mockEngine);

    // Set up recovery volume and yield
    EngineNumber volume = new EngineNumber(BigDecimal.valueOf(30), "kg");
    Operation volumeOperation = new PreCalculatedOperation(volume);

    EngineNumber yield = new EngineNumber(BigDecimal.valueOf(100), "%");
    Operation yieldOperation = new PreCalculatedOperation(yield);

    // Set up the mock machine to return the correct values
    when(mockMachine.getResult()).thenReturn(volume, yield);

    String displaceTarget = "R-404A";
    RecoverOperation operation = new RecoverOperation(volumeOperation, yieldOperation, displaceTarget);

    operation.execute(mockMachine);

    // Verify the recycle method was called with displacement parameter
    verify(mockEngine).recycle(eq(volume), eq(yield), any(YearMatcher.class), eq(displaceTarget));
  }

  /**
   * Test the execute method with displacement and during.
   */
  @Test
  public void testExecuteWithDisplacementAndDuring() {
    // Set up recovery volume and yield using real engine (simpler approach)
    EngineNumber volume = new EngineNumber(BigDecimal.valueOf(25), "kg");
    Operation volumeOperation = new PreCalculatedOperation(volume);

    EngineNumber yield = new EngineNumber(BigDecimal.valueOf(100), "%");
    Operation yieldOperation = new PreCalculatedOperation(yield);

    // Set up during with no specific time constraints for simplicity
    ParsedDuring during = new ParsedDuring(Optional.empty(), Optional.empty());

    String displaceTarget = "manufacture";
    RecoverOperation operation = new RecoverOperation(volumeOperation, yieldOperation, displaceTarget, during);

    // Execute with real machine - just verify it doesn't throw an exception
    operation.execute(machine);

    // Test passes if no exception is thrown
    assertNotNull(operation, "RecoverOperation should execute with displacement and during");
  }
}
