/**
 * Fragment that wraps an executable command.
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.lang.fragment;

import org.kigalisim.engine.Engine;

/**
 * Fragment that wraps an executable command for execution against an engine.
 *
 * <p>This fragment contains a command that can be executed against a KigaliSim engine.</p>
 */
public class ExecutableFragment extends Fragment {

  private final CommandFragment command;

  /**
   * Create a new executable fragment.
   *
   * @param command The command to wrap
   */
  public ExecutableFragment(CommandFragment command) {
    this.command = command;
  }

  /**
   * Execute the wrapped command against the given engine.
   *
   * @param engine The engine to execute against
   */
  public void execute(Engine engine) {
    command.execute(engine);
  }
}
