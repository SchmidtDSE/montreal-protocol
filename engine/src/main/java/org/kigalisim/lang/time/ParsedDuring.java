/**
 * Description of QubecTalk time period.
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.lang.time;

import java.util.Optional;


/**
 * Description of a "during" time period described in QubecTalk.
 *
 * <div>Description of a "during" time period described in QubecTalk where the following are
 * observed:
 *
 * <ul>
 *   <li>Single year ranges should have both start and end with the same TimePoints.</li>
 *   <li>
 *     A range which should apply starting in a year until the end may have start be non-empty and
 *     the end is empty. Alternatively, start may be given and empty be onwards (dynamic cap).
 *   </li>
 *   <li>
 *     A range which should apply until a given year may have start be non-empty an the start is
 *     empty. Alternatively, end may be given and start be beginning (dynamic cap).
 *   </li>
 *   <li>Other ranges may have start and end both specified.</li>
 * </ul>
 */
public class ParsedDuring {

  private final Optional<TimePointRealized> start;
  private final Optional<TimePointRealized> end;

  /**
   * Create a description of a "during" time period.
   *
   * @param start The start of the period, or empty if unbounded.
   * @param end The end of the period, or empty if unbounded.
   */
  public ParsedDuring(Optional<TimePointRealized> start, Optional<TimePointRealized> end) {
    this.start = start;
    this.end = end;
  }

  /**
   * Get the start of the period.
   *
   * @return The start of the period, or empty if unbounded.
   */
  public Optional<TimePointRealized> getStart() {
    return start;
  }

  /**
   * Get the end of the period.
   *
   * @return The end of the period, or empty if unbounded.
   */
  public Optional<TimePointRealized> getEnd() {
    return end;
  }

}
