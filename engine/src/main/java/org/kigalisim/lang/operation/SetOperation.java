package org.kigalisim.lang.operation;

import java.util.Optional;

import org.kigalisim.engine.Engine;
import org.kigalisim.engine.number.EngineNumber;
import org.kigalisim.engine.state.YearMatcher;
import org.kigalisim.lang.machine.PushDownMachine;
import org.kigalisim.lang.time.ParsedDuring;


public class SetOperation implements Operation {

  private final String stream;
  private final Operation valueOperation;
  private final Optional<ParsedDuring> duringMaybe;

  public SetOperation(String stream, Operation valueOperation) {
    this.stream = stream;
    this.valueOperation = valueOperation;
    duringMaybe = Optional.empty();
  }

  public SetOperation(String stream, Operation valueOperation, ParsedDuring during) {
    this.stream = stream;
    this.valueOperation = valueOperation;
    duringMaybe = Optional.of(during);
  }

  @Override
  public void execute(PushDownMachine machine) {
    valueOperation.execute(machine);
    EngineNumber result = machine.getResult();

    ParsedDuring parsedDuring = duringMaybe.orElseGet(
        () -> new ParsedDuring(Optional.empty(), Optional.empty())
    );
    YearMatcher yearMatcher = parsedDuring.buildYearMatcher(machine);

    Engine engine = machine.getEngine();
    engine.setStream(stream, result, yearMatcher);
  }

}
