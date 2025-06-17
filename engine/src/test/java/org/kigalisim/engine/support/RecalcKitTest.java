/**
 * Tests for RecalcKit.
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.engine.support;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.kigalisim.engine.number.UnitConverter;
import org.kigalisim.engine.state.ConverterStateGetter;
import org.kigalisim.engine.state.StreamKeeper;

/**
 * Tests for RecalcKit.
 */
public class RecalcKitTest {

  @Test
  public void testConstructorWithAllValues() {
    StreamKeeper streamKeeper = mock(StreamKeeper.class);
    UnitConverter unitConverter = mock(UnitConverter.class);
    ConverterStateGetter stateGetter = mock(ConverterStateGetter.class);

    RecalcKit kit = new RecalcKit(
        Optional.of(streamKeeper),
        Optional.of(unitConverter),
        Optional.of(stateGetter)
    );

    assertTrue(kit.getStreamKeeper().isPresent());
    assertTrue(kit.getUnitConverter().isPresent());
    assertTrue(kit.getStateGetter().isPresent());
  }

  @Test
  public void testConstructorWithEmptyValues() {
    RecalcKit kit = new RecalcKit(
        Optional.empty(),
        Optional.empty(),
        Optional.empty()
    );

    assertFalse(kit.getStreamKeeper().isPresent());
    assertFalse(kit.getUnitConverter().isPresent());
    assertFalse(kit.getStateGetter().isPresent());
  }
}