/**
 * Tests for RecalcKitBuilder.
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.engine.support;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.Test;
import org.kigalisim.engine.number.UnitConverter;
import org.kigalisim.engine.state.ConverterStateGetter;
import org.kigalisim.engine.state.StreamKeeper;

/**
 * Tests for RecalcKitBuilder.
 */
public class RecalcKitBuilderTest {

  @Test
  public void testDefaultConstructor() {
    RecalcKitBuilder builder = new RecalcKitBuilder();
    RecalcKit kit = builder.build();

    assertFalse(kit.getStreamKeeper().isPresent());
    assertFalse(kit.getUnitConverter().isPresent());
    assertFalse(kit.getStateGetter().isPresent());
  }

  @Test
  public void testBuilderWithAllValues() {
    StreamKeeper streamKeeper = mock(StreamKeeper.class);
    UnitConverter unitConverter = mock(UnitConverter.class);
    ConverterStateGetter stateGetter = mock(ConverterStateGetter.class);

    RecalcKitBuilder builder = new RecalcKitBuilder();
    RecalcKit kit = builder
        .setStreamKeeper(streamKeeper)
        .setUnitConverter(unitConverter)
        .setStateGetter(stateGetter)
        .build();

    assertTrue(kit.getStreamKeeper().isPresent());
    assertTrue(kit.getUnitConverter().isPresent());
    assertTrue(kit.getStateGetter().isPresent());
  }

  @Test
  public void testBuilderWithNullValues() {
    RecalcKitBuilder builder = new RecalcKitBuilder();
    RecalcKit kit = builder
        .setStreamKeeper(null)
        .setUnitConverter(null)
        .setStateGetter(null)
        .build();

    assertFalse(kit.getStreamKeeper().isPresent());
    assertFalse(kit.getUnitConverter().isPresent());
    assertFalse(kit.getStateGetter().isPresent());
  }

  @Test
  public void testBuilderChaining() {
    StreamKeeper streamKeeper = mock(StreamKeeper.class);
    UnitConverter unitConverter = mock(UnitConverter.class);

    RecalcKitBuilder builder = new RecalcKitBuilder();
    RecalcKit kit = builder
        .setStreamKeeper(streamKeeper)
        .setUnitConverter(unitConverter)
        .build();

    assertTrue(kit.getStreamKeeper().isPresent());
    assertTrue(kit.getUnitConverter().isPresent());
    assertFalse(kit.getStateGetter().isPresent());
  }
}