/**
 * Fragment representing an executable command against an engine.
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.lang.fragment;

import org.kigalisim.engine.Engine;

/**
 * Fragment representing a command that can be executed against an engine.
 *
 * <p>This is a functional interface that represents a command to be executed
 * against a KigaliSim engine.</p>
 */
@FunctionalInterface
public interface CommandFragment {

  /**
   * Execute this command against the given engine.
   *
   * @param engine The engine to execute the command against
   */
  void execute(Engine engine);
}
