/**
 * Builder for creating RecalcKit instances.
 *
 * <p>This builder provides a fluent interface for constructing RecalcKit instances
 * with default empty Optional values.</p>
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.engine.support;

import org.kigalisim.engine.number.UnitConverter;
import org.kigalisim.engine.state.ConverterStateGetter;
import org.kigalisim.engine.state.StreamKeeper;

/**
 * Builder for creating RecalcKit instances.
 */
public class RecalcKitBuilder {

  private StreamKeeper streamKeeper;
  private UnitConverter unitConverter;
  private ConverterStateGetter stateGetter;

  /**
   * Create a new RecalcKitBuilder.
   */
  public RecalcKitBuilder() {
    this.streamKeeper = null;
    this.unitConverter = null;
    this.stateGetter = null;
  }

  /**
   * Set the stream keeper.
   *
   * @param streamKeeper The stream keeper to set
   * @return This builder for chaining
   */
  public RecalcKitBuilder setStreamKeeper(StreamKeeper streamKeeper) {
    this.streamKeeper = streamKeeper;
    return this;
  }

  /**
   * Set the unit converter.
   *
   * @param unitConverter The unit converter to set
   * @return This builder for chaining
   */
  public RecalcKitBuilder setUnitConverter(UnitConverter unitConverter) {
    this.unitConverter = unitConverter;
    return this;
  }

  /**
   * Set the state getter.
   *
   * @param stateGetter The state getter to set
   * @return This builder for chaining
   */
  public RecalcKitBuilder setStateGetter(ConverterStateGetter stateGetter) {
    this.stateGetter = stateGetter;
    return this;
  }

  /**
   * Build the RecalcKit.
   *
   * @return A new RecalcKit instance
   * @throws IllegalStateException if any required field is missing
   */
  public RecalcKit build() {
    if (streamKeeper == null) {
      throw new IllegalStateException("StreamKeeper is required");
    }
    if (unitConverter == null) {
      throw new IllegalStateException("UnitConverter is required");
    }
    if (stateGetter == null) {
      throw new IllegalStateException("ConverterStateGetter is required");
    }
    return new RecalcKit(streamKeeper, unitConverter, stateGetter);
  }
}