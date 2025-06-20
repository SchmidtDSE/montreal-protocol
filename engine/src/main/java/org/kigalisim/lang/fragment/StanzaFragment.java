/**
 * Fragment representing a stanza in a QubecTalk program.
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.lang.fragment;

import java.util.ArrayList;
import java.util.List;
import org.kigalisim.engine.Engine;

/**
 * Fragment representing a stanza (like default, policy, or simulations).
 *
 * <p>A stanza contains executable commands and possibly simulation definitions.</p>
 */
public class StanzaFragment extends Fragment {

  private final String name;
  private final List<Fragment> commands;
  private final List<SimulationFragment> simulations;

  /**
   * Create a new stanza fragment.
   *
   * @param name The name of the stanza
   * @param commands The executable commands in this stanza
   * @param simulations The simulations defined in this stanza (empty if not a simulations stanza)
   */
  public StanzaFragment(String name, List<Fragment> commands, List<SimulationFragment> simulations) {
    this.name = name;
    this.commands = commands;
    this.simulations = simulations != null ? simulations : new ArrayList<>();
  }

  /**
   * Get the name of this stanza.
   *
   * @return The stanza name
   */
  public String getName() {
    return name;
  }

  /**
   * Get the simulations defined in this stanza.
   *
   * @return List of simulations (empty if not a simulations stanza)
   */
  public List<SimulationFragment> getSimulations() {
    return simulations;
  }

  /**
   * Execute this stanza against an engine.
   *
   * @param engine The engine to execute commands against
   */
  public void execute(Engine engine) {
    engine.setStanza(name);
    for (Fragment command : commands) {
      if (command instanceof ExecutableFragment) {
        ((ExecutableFragment) command).execute(engine);
      }
    }
  }
}
