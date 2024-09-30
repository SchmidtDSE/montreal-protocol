import {EngineNumber} from "engine_number";
import {YearMatcher} from "engine_state";
import {
  AboutStanza,
  Application,
  Command,
  DefinitionalStanza,
  Program,
  ReplaceCommand,
  SimulationScenario,
  SimulationStanza,
  Substance,
  buildAddCode,
  finalizeCodePieces,
  indent,
} from "ui_translator";


function buildTestApplication(isMod) {
  const command = new Command(
    "initial charge",
    "manufacture",
    new EngineNumber(5, "kg / unit"),
    null,
  );
  const substance = new Substance(
    "sub",
    command,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    isMod,
    true,
  );
  const application = new Application("app", [substance], isMod, true);
  return application;
}


function buildUiTranslatorReverseTests() {
  QUnit.module("UiTranslatorCompilerReverse", function() {
    QUnit.test("indents", function(assert) {
      const result = indent(["a", "b"], 2);
      assert.equal(result.length, 2);
      assert.deepEqual(result[0], "  a");
      assert.deepEqual(result[1], "  b");
    });

    QUnit.test("builds add code", function(assert) {
      const pieces = [];
      const addCode = buildAddCode(pieces);
      addCode("a", 2);
      assert.equal(pieces.length, 1);
      assert.deepEqual(pieces[0], "  a");
    });

    QUnit.test("finalizes code pieces", function(assert) {
      const pieces = ["a", "b", "c"];
      const result = finalizeCodePieces(pieces);
      assert.deepEqual(result, "a\nb\nc");
    });

    QUnit.test("initial charges substances", function(assert) {
      const command = new Command(
        "initial charge",
        "manufacture",
        new EngineNumber(5, "kg / unit"),
        null,
      );
      const substance = new Substance(
        "test",
        command,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        true,
        true,
      );
      const code = substance.toCode(0);
      assert.notEqual(code.indexOf("modify substance \"test\""), -1);
      assert.notEqual(code.indexOf("initial charge with 5 kg / unit for manufacture"), -1);
    });

    QUnit.test("caps substances", function(assert) {
      const command = new Command(
        "cap",
        "manufacture",
        new EngineNumber(5, "mt"),
        null,
      );
      const substance = new Substance(
        "test",
        null,
        command,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        true,
        true,
      );
      const code = substance.toCode(0);
      assert.notEqual(code.indexOf("cap manufacture to 5 mt"), -1);
    });

    QUnit.test("changes substances", function(assert) {
      const command = new Command(
        "change",
        "manufacture",
        new EngineNumber("+5", "% / year"),
        null,
      );
      const substance = new Substance(
        "test",
        null,
        null,
        command,
        null,
        null,
        null,
        null,
        null,
        null,
        true,
        true,
      );
      const code = substance.toCode(0);
      assert.notEqual(code.indexOf("change manufacture by +5 % / year"), -1);
    });

    QUnit.test("emits from substances", function(assert) {
      const command = new Command(
        "change",
        null,
        new EngineNumber("5", "tCO2e / unit"),
        null,
      );
      const substance = new Substance(
        "test",
        null,
        null,
        null,
        command,
        null,
        null,
        null,
        null,
        null,
        true,
        true,
      );
      const code = substance.toCode(0);
      assert.notEqual(code.indexOf("emit 5 tCO2e / unit"), -1);
    });

    QUnit.test("recharges substances", function(assert) {
      const command = new Command(
        "recharge",
        new EngineNumber("10", "% / year"),
        new EngineNumber("5", "kg / unit"),
        null,
      );
      const substance = new Substance(
        "test",
        null,
        null,
        null,
        null,
        command,
        null,
        null,
        null,
        null,
        true,
        true,
      );
      const code = substance.toCode(0);
      assert.notEqual(code.indexOf("recharge 10 % / year with 5 kg / unit"), -1);
    });

    QUnit.test("recycles substances", function(assert) {
      const command = new Command(
        "recycle",
        new EngineNumber("10", "%"),
        new EngineNumber("100", "%"),
        null,
      );
      const substance = new Substance(
        "test",
        null,
        null,
        null,
        null,
        null,
        command,
        null,
        null,
        null,
        true,
        true,
      );
      const code = substance.toCode(0);
      assert.notEqual(code.indexOf("recover 10 % with 100 % reuse"), -1);
    });

    QUnit.test("replaces substances", function(assert) {
      const command = new ReplaceCommand(
        new EngineNumber("10", "%"),
        "manufacture",
        "other",
        null,
      );
      const substance = new Substance(
        "test",
        null,
        null,
        null,
        null,
        null,
        null,
        command,
        null,
        null,
        true,
        true,
      );
      const code = substance.toCode(0);
      assert.notEqual(code.indexOf("replace 10 % of manufacture with \"other\""), -1);
    });

    QUnit.test("retires substances", function(assert) {
      const command = new Command(
        "retire",
        null,
        new EngineNumber("10", "%"),
        null,
      );
      const substance = new Substance(
        "test",
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        command,
        null,
        true,
        true,
      );
      const code = substance.toCode(0);
      assert.notEqual(code.indexOf("retire 10 %"), -1);
    });

    QUnit.test("sets values in substances", function(assert) {
      const command = new Command(
        "setVal",
        "manufacture",
        new EngineNumber("10", "mt"),
        null,
      );
      const substance = new Substance(
        "test",
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        command,
        true,
        true,
      );
      const code = substance.toCode(0);
      assert.notEqual(code.indexOf("set manufacture to 10 mt"), -1);
    });

    QUnit.test("supports duration single year", function(assert) {
      const command = new Command(
        "setVal",
        "manufacture",
        new EngineNumber("10", "mt"),
        new YearMatcher(1, 1),
      );
      const substance = new Substance(
        "test",
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        command,
        true,
        true,
      );
      const code = substance.toCode(0);
      assert.notEqual(code.indexOf("set manufacture to 10 mt during year 1"), -1);
    });

    QUnit.test("supports duration muiltiple years", function(assert) {
      const command = new Command(
        "retire",
        null,
        new EngineNumber("10", "%"),
        new YearMatcher(2, 5),
      );
      const substance = new Substance(
        "test",
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        command,
        null,
        true,
        true,
      );
      const code = substance.toCode(0);
      assert.notEqual(code.indexOf("retire 10 % during years 2 to 5"), -1);
    });

    QUnit.test("supports duration with min year", function(assert) {
      const command = new ReplaceCommand(
        new EngineNumber("10", "%"),
        "manufacture",
        "other",
        new YearMatcher(2, null),
      );
      const substance = new Substance(
        "test",
        null,
        null,
        null,
        null,
        null,
        null,
        command,
        null,
        null,
        true,
        true,
      );
      const code = substance.toCode(0);
      assert.notEqual(code.indexOf(
        "replace 10 % of manufacture with \"other\" during years 2 to onwards",
      ), -1);
    });

    QUnit.test("supports duration with max year", function(assert) {
      const command = new Command(
        "recycle",
        new EngineNumber("10", "%"),
        new EngineNumber("100", "%"),
        new YearMatcher(null, 5),
      );
      const substance = new Substance(
        "test",
        null,
        null,
        null,
        null,
        null,
        command,
        null,
        null,
        null,
        true,
        true,
      );
      const code = substance.toCode(0);
      assert.notEqual(code.indexOf(
        "recover 10 % with 100 % reuse during years beginning to 5",
      ), -1);
    });

    QUnit.test("supports complex substances", function(assert) {
      const initialCharge = new Command(
        "initial charge",
        "manufacture",
        new EngineNumber(5, "kg / unit"),
        new YearMatcher(1, 1),
      );
      const cap = new Command(
        "cap",
        "manufacture",
        new EngineNumber(5, "mt"),
        new YearMatcher(3, 4),
      );
      const substance = new Substance(
        "test",
        initialCharge,
        cap,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        false,
        true,
      );
      const code = substance.toCode(0);
      assert.notEqual(code.indexOf("define substance \"test\""), -1);
      assert.notEqual(code.indexOf(
        "initial charge with 5 kg / unit for manufacture during year 1",
      ), -1);
      assert.notEqual(code.indexOf("cap manufacture to 5 mt during years 3 to 4"), -1);
    });

    QUnit.test("converts applications to code", function(assert) {
      const application = buildTestApplication(false);
      const code = application.toCode(0);
      assert.notEqual(code.indexOf("define application \"app\""), -1);
      assert.notEqual(code.indexOf("define substance \"sub\""), -1);
    });

    QUnit.test("converts simulation stanzas to code", function(assert) {
      const scenario = new SimulationScenario("scenario", ["policy1", "policy2"], 1, 5, true);
      const stanza = new SimulationStanza([scenario], true);
      const code = stanza.toCode(0);
      assert.notEqual(code.indexOf("start simulations"), -1);
      assert.notEqual(code.indexOf("simulate \"scenario\""), -1);
      assert.notEqual(code.indexOf("using \"policy1\""), -1);
      assert.notEqual(code.indexOf("then \"policy2\""), -1);
      assert.notEqual(code.indexOf("from years 1 to 5"), -1);
    });

    QUnit.test("converts default to code", function(assert) {
      const application = buildTestApplication(false);
      const stanza = new DefinitionalStanza("default", [application], true);
      const code = stanza.toCode(0);
      assert.notEqual(code.indexOf("start default"), -1);
      assert.notEqual(code.indexOf("define application \"app\""), -1);
      assert.notEqual(code.indexOf("end default"), -1);
    });

    QUnit.test("converts policy to code", function(assert) {
      const application = buildTestApplication(false);
      const stanza = new DefinitionalStanza("inervention", [application], true);
      const code = stanza.toCode(0);
      assert.notEqual(code.indexOf("start policy \"inervention\""), -1);
      assert.notEqual(code.indexOf("define application \"app\""), -1);
      assert.notEqual(code.indexOf("end policy"), -1);
    });

    QUnit.test("converts about stanza to code", function(assert) {
      const stanza = new AboutStanza();
      const code = stanza.toCode(0);
      assert.notEqual(code.indexOf("start about"), -1);
      assert.notEqual(code.indexOf("end about"), -1);
    });

    QUnit.test("converts program to code", function(assert) {
      const application = buildTestApplication();
      const applicationMod = buildTestApplication(true);
      const policy = new DefinitionalStanza("intervention", [applicationMod], true);
      const scenario = new SimulationScenario("scenario", ["intervention"], 1, 5, true);
      const program = new Program([application], [policy], [scenario], true);
      const code = program.toCode(0);
      console.log(code);
      assert.notEqual(code.indexOf("start default"), -1);
      assert.notEqual(code.indexOf("start policy \"intervention\""), -1);
      assert.notEqual(code.indexOf("define application \"app\""), -1);
      assert.notEqual(code.indexOf("define substance \"sub\""), -1);
      assert.notEqual(code.indexOf("modify application \"app\""), -1);
      assert.notEqual(code.indexOf("modify substance \"sub\""), -1);
      assert.notEqual(code.indexOf("simulate \"scenario\""), -1);
    });
  });
}


export {buildUiTranslatorReverseTests};
