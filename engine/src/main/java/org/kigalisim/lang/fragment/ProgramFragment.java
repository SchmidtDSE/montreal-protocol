/**
 * Fragment representing a complete QubecTalk program.
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.lang.fragment;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.kigalisim.engine.Engine;
import org.kigalisim.engine.SingleThreadEngine;
import org.kigalisim.engine.serializer.EngineResult;

/**
 * Fragment representing a complete QubecTalk program that can be executed.
 *
 * <p>This fragment contains all the stanzas of a QubecTalk program and can execute
 * the simulations defined within it.</p>
 */
public class ProgramFragment extends Fragment {

  private final Map<String, StanzaFragment> stanzasByName;

  /**
   * Create a new program fragment.
   *
   * @param stanzas The stanzas that make up this program
   */
  public ProgramFragment(List<StanzaFragment> stanzas) {
    this.stanzasByName = new HashMap<>();
    for (StanzaFragment stanza : stanzas) {
      stanzasByName.put(stanza.getName(), stanza);
    }
  }

  /**
   * Execute the program and return simulation results.
   *
   * @return List of simulation results, where each element is a list of yearly results
   */
  public List<List<EngineResult>> execute() {
    if (!stanzasByName.containsKey("simulations")) {
      return new ArrayList<>();
    }

    StanzaFragment simulationsStanza = stanzasByName.get("simulations");
    List<SimulationFragment> simulations = simulationsStanza.getSimulations();

    List<List<EngineResult>> results = new ArrayList<>();

    for (SimulationFragment simulation : simulations) {
      // For now, just execute the basic simulation
      // In a full implementation, this would handle trials and different scenarios
      Engine engine = new SingleThreadEngine(simulation.getStartYear(), simulation.getEndYear());

      List<EngineResult> yearResults = new ArrayList<>();

      // Execute default stanza
      if (stanzasByName.containsKey("default")) {
        StanzaFragment defaultStanza = stanzasByName.get("default");
        defaultStanza.execute(engine);
      }

      // Run simulation for each year
      while (!engine.getIsDone()) {
        yearResults.addAll(engine.getResults());
        engine.incrementYear();
      }

      results.add(yearResults);
    }

    return results;
  }
}
