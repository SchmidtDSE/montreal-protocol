import { Compiler } from "compiler";


function loadRemote(path) {
  return fetch(path).then((response) => response.text());
}

function buildCompilerTests() {
  QUnit.module("Compiler", function () {
    QUnit.test("gets toolkit", function (assert) {
      const toolkit = QubecTalk.getToolkit();
      assert.ok(toolkit !== undefined);
      assert.ok(toolkit["antlr4"] !== undefined);
      assert.ok(toolkit["QubecTalkLexer"] !== undefined);
      assert.ok(toolkit["QubecTalkParser"] !== undefined);
      assert.ok(toolkit["QubecTalkListener"] !== undefined);
      assert.ok(toolkit["QubecTalkVisitor"] !== undefined);
    });

    QUnit.test("initializes a compiler", (assert) => {
      const compiler = new Compiler();
      assert.ok(compiler !== undefined);
    });

    const buildTest = (name, filepath, checks) => {
      QUnit.test(name, (assert) => {
        const done = assert.async();
        loadRemote(filepath).then((content) => {
          assert.ok(content.length > 0);
          
          const compiler = new Compiler();
          const compilerResult = compiler.compile(content);
          assert.ok(compilerResult.getErrors().length == 0);

          const program = compilerResult.getProgram();
          const programResult = program();

          checks.forEach((check) => {
            check(programResult, assert);
          });
          
          done();
        });
      });
    };

    const getResult = (results, scenario, year, trialIndex, application, substance) => {
      const result = results.filter((x) => x.getName() === scenario)[0];
      const trials = result.getTrialResults();
      const trial = trials[trialIndex];
      const trialFlat = trial.flat();
      return trialFlat.filter((x) => x.getYear() == year)
        .filter((x) => x.getApplication() === application)
        .filter((x) => x.getSubstance() === substance)[0];
    };

    const BAU_NAME = "businessasusual";

    buildTest(
      "runs a basic script",
      "/test/qta/basic.qta", [
        (result, assert) => {
          const record = getResult(result, BAU_NAME, 1, 0, "test", "test");
          const equipment = record.getPopulation();
          assert.ok(Math.abs(equipment.getValue() - 20000) < 0.0001);
          assert.ok(equipment.getUnits() === "units");
        },
        (result, assert) => {
          const record = getResult(result, BAU_NAME, 1, 0, "test", "test");
          const equipment = record.getEmissions();
          assert.ok(Math.abs(equipment.getValue() - 500) < 0.0001);
          assert.ok(equipment.getUnits() === "tCO2e");
        },
        (result, assert) => {
          const record = getResult(result, BAU_NAME, 1, 0, "test", "test");
          const equipment = record.getManufacture();
          assert.ok(Math.abs(equipment.getValue() - 100000) < 0.0001);
          assert.ok(equipment.getUnits() === "kg");
        },
      ],
    );
  });
}

export { buildCompilerTests };
