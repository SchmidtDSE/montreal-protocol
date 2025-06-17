/**
 * Container for dependencies needed by recalculation strategies.
 *
 * <p>This class provides all the dependencies that recalculation strategies need
 * to perform their operations, eliminating the need to cast Engine to SingleThreadEngine.</p>
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.engine.support;

import java.util.Optional;
import org.kigalisim.engine.number.UnitConverter;
import org.kigalisim.engine.state.ConverterStateGetter;
import org.kigalisim.engine.state.StreamKeeper;

/**
 * Container for dependencies needed by recalculation strategies.
 */
public class RecalcKit {

  private final Optional<StreamKeeper> streamKeeper;
  private final Optional<UnitConverter> unitConverter;
  private final Optional<ConverterStateGetter> stateGetter;

  /**
   * Create a new RecalcKit.
   *
   * @param streamKeeper The stream keeper instance
   * @param unitConverter The unit converter instance
   * @param stateGetter The state getter instance
   */
  public RecalcKit(Optional<StreamKeeper> streamKeeper, Optional<UnitConverter> unitConverter,
      Optional<ConverterStateGetter> stateGetter) {
    this.streamKeeper = streamKeeper;
    this.unitConverter = unitConverter;
    this.stateGetter = stateGetter;
  }

  /**
   * Get the stream keeper.
   *
   * @return The stream keeper wrapped in Optional
   */
  public Optional<StreamKeeper> getStreamKeeper() {
    return streamKeeper;
  }

  /**
   * Get the unit converter.
   *
   * @return The unit converter wrapped in Optional
   */
  public Optional<UnitConverter> getUnitConverter() {
    return unitConverter;
  }

  /**
   * Get the state getter.
   *
   * @return The state getter wrapped in Optional
   */
  public Optional<ConverterStateGetter> getStateGetter() {
    return stateGetter;
  }
}