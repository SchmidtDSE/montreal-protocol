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

    const buildTest = (name, filepath) => {
      QUnit.test(name, (assert) => {
        const done = assert.async();
        loadRemote(filepath).then((content) => {
          assert.ok(content.length > 0);
          
          const compiler = new Compiler();
          const compilerResult = compiler.compile(content);
          assert.ok(compilerResult.getErrors().length == 0);

          const program = compilerResult.getProgram();
          const programResult = program();
          
          done();
        });
      });
    };

    buildTest("compiles basic script", "/test/qta/basic.qta");
  });
}

export { buildCompilerTests };
