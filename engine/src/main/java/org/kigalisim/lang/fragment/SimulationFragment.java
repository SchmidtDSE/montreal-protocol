/**
 * Fragment representing a simulation definition.
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.lang.fragment;

import java.util.List;

/**
 * Fragment representing a simulation definition.
 *
 * <p>Contains the parameters for running a simulation including name, years, and scenarios.</p>
 */
public class SimulationFragment extends Fragment {

  private final String name;
  private final int startYear;
  private final int endYear;
  private final List<String> scenarios;

  /**
   * Create a new simulation fragment.
   *
   * @param name The name of the simulation
   * @param startYear The starting year for the simulation
   * @param endYear The ending year for the simulation
   * @param scenarios The list of scenarios/policies to apply (default is always first)
   */
  public SimulationFragment(String name, int startYear, int endYear, List<String> scenarios) {
    this.name = name;
    this.startYear = startYear;
    this.endYear = endYear;
    this.scenarios = scenarios;
  }

  /**
   * Get the simulation name.
   *
   * @return The name of the simulation
   */
  public String getName() {
    return name;
  }

  /**
   * Get the starting year.
   *
   * @return The starting year of the simulation
   */
  public int getStartYear() {
    return startYear;
  }

  /**
   * Get the ending year.
   *
   * @return The ending year of the simulation
   */
  public int getEndYear() {
    return endYear;
  }

  /**
   * Get the scenarios to apply.
   *
   * @return List of scenario names
   */
  public List<String> getScenarios() {
    return scenarios;
  }
}
