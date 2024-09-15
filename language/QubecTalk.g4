grammar QubecTalk;

/**
 * ===========
 * == Lexer ==
 * ===========
 **/

/**
 * ------------
 * -- Basics --
 * ------------
 **/

WHITE_SPACE: [ \u000B\t\r\n] -> channel(HIDDEN);

COMMENT: '#' ~[\r\n]* -> channel(HIDDEN);

FLOAT_: [0-9]+ '.' [0-9]+;

IDENTIFIER_: [A-Za-z][A-Za-z0-9]*;

INTEGER_: [0-9]+;

QUOTE_: '"';

/**
 * ----------------------------------
 * -- Basic arithmetic and logical --
 * ----------------------------------
 **/

ADD_: '+';

DIV_: '/';

LPAREN_: '(';

MULT_: '*';

POW_: '^';

RPAREN_: ')';

SUB_: '-';

/**
 * -----------------
 * -- Conditional --
 * -----------------
 **/

AND_: 'and';

ENDIF_: 'endif';

ELSE_: 'else';

EQEQ_: '==';

GT_: '>';

GTEQ_: '>=';

IF_: 'if';

LT_: '<';

LTEQ_: '<=';

NEQ_: '!=';

OR_: 'or';

/**
 * --------------
 * -- Sampling --
 * --------------
 **/

MEAN_: 'mean';

NORMALLY_: 'normally';

SAMPLE_: 'sample';

STD_: 'std';

UNIFORMLY_: 'uniformly';

/**
 * -----------
 * -- Limit --
 * -----------
 **/

LIMIT_: 'limit';

LBRAC_: '[';

RBRAC_: ']';

COMMA_: ',';

/**
 * -------------
 * -- Stanzas --
 * -------------
 **/

ABOUT_: 'about';

APPLICATION_: 'application';

DEFAULT_: 'default';

DEFINE_: 'define';

END_: 'end';

POLICY_: 'policy';

SIMULATIONS_: 'simulations';

SUBSTANCE_: 'substance';

START_: 'start';

USES_: 'uses';

VARIABLES_: 'variables';

/**
 * --------------
 * -- Commands --
 * --------------
 **/

ACROSS_: 'across';

AS_: 'as';

BY_: 'by';

CAP_: 'cap';

CHANGE_: 'change';

CHARGE_: 'charge';

DURING_: 'during';

EMIT_: 'emit';

FOR_: 'for';

FROM_: 'from';

GET_: 'get';

IN_: 'in';

INITIAL_: 'inital';

MODIFY_: 'modify';

OF_: 'of';

RECHARGE_: 'recharge';

RECOVER_: 'recover';

REPLACE_: 'replace';

RETIRE_: 'retire';

REUSE_: 'reuse';

SET_: 'set';

SIMULATE_: 'simulate';

THEN_: 'then';

TO_: 'to';

TRIALS_: 'trials';

USING_: 'using';

WITH_: 'with';

/**
 * -------------
 * -- Streams --
 * -------------
 **/

EQUIPMENT_: 'equipment';

EXPORT_: 'export';

IMPORT_: 'import';

MANUFACTURE_: 'manufacture';

SALES_: 'sales';

/**
 * -----------
 * -- Units --
 * -----------
 **/

ANNUALLY_: 'annually';

KG_: 'kg';

MT_: 'mt';

ONWARDS_: 'onwards';

PERCENT_: '%';

TCO2_: 'tCO2';

UNIT_: 'unit';

UNITS_: 'units';

YEAR_: 'year';

YEARS_: 'years';

/**
 * ============
 * == Parser ==
 * ============
 **/

number: (SUB_|ADD_)? (FLOAT_ | INTEGER_);

string: QUOTE_ (~QUOTE_)* QUOTE_;

unit: (KG_ | MT_ | PERCENT_ | TCO2_ | UNIT_ | UNITS_ | YEAR_ | YEARS_);

unitValue: expression unit  # regularUnitValue
  | expression unit DIV_ unit  # scaledUnitValue
  ;

/**
 * -----------------
 * -- Expressions --
 * -----------------
 **/

expression: number  # simpleExpression
  | GET_ stream OF_ string  # getStreamIndirectSubstance
  | GET_ stream OF_ string IN_ string  # getStreamIndirectSubstanceApp
  | identifier  # simpleIdentifier
  | expression POW_ expression  # powExpression
  | expression op=(MULT_ | DIV_) expression  # multiplyExpression
  | expression op=(ADD_ | SUB_) expression  # additionExpression
  | SAMPLE_ NORMALLY_ FROM_  MEAN_ OF_ expression STD_ OF_ expression  # drawNormalExpression
  | SAMPLE_ UNIFORMLY_ FROM_  expression TO_ expression  # drawUniformExpression
  | LPAREN_ expression RPAREN_ # parenExpression
  | LIMIT_ operand=identifier TO_ LBRAC_ limit=expression COMMA_ RBRAC_ # limitMaxExpression
  | LIMIT_ operand=identifier TO_ LBRAC_ COMMA_ limit=expression RBRAC_ # limitMinExpression
  | LIMIT_ operand=identifier TO_ LBRAC_ lower=expression COMMA_ upper=expression RBRAC_ # limitBoundExpression
  | pos=expression op=(NEQ_ | GT_ | LT_ | EQEQ_ | LTEQ_ | GTEQ_) neg=expression  # conditionExpression
  | pos=expression IF_ cond=expression ELSE_ neg=expression  ENDIF_  # conditionalExpression
  ;

/**
 * -----------------
 * -- Identifiers --
 * -----------------
 **/

stream: (EQUIPMENT_ | EXPORT_ | IMPORT_ | MANUFACTURE_ | SALES_);

identifier: stream  # identifierAsStream
  | IDENTIFIER_  # identifierAsVar
  ;

/**
 * ---------------
 * -- Durations --
 * ---------------
 **/

during: DURING_ YEAR_ expression  # duringSingleYear
  | DURING_ YEARS_ expression TO_ expression  # duringYearRange
  | DURING_ YEARS_ expression AND_ ONWARDS_  # minYear
  ;

/**
 * -------------
 * -- Stanzas --
 * -------------
 **/

stanza: START_ ABOUT_ END_ ABOUT_  # aboutStanza
  | START_ DEFAULT_ applicationDef* END_ DEFAULT_  # defaultStanza
  | START_ POLICY_ name=string applicationMod* END_ POLICY_  # policyStanza
  | START_ SIMULATIONS_ (simulate | globalStatement)* END_ SIMULATIONS_  # simulationsStanza
  ;

applicationDef: DEFINE_ APPLICATION_ name=string (substanceDef | globalStatement)* END_ APPLICATION_;

substanceDef: USES_ SUBSTANCE_ name=string (substanceStatement | globalStatement) * END_ SUBSTANCE_;

applicationMod: MODIFY_ APPLICATION_ name=string (substanceMod | globalStatement)* END_ APPLICATION_;

substanceMod: MODIFY_ SUBSTANCE_ name=string (substanceStatement | globalStatement)* END_ SUBSTANCE_;

/**
 * ----------------
 * -- Statements --
 * ----------------
 **/

capStatement: CAP_ target=identifier TO_ value=unitValue  # capAllYears
  | CAP_ target=identifier TO_ value=unitValue duration=during  # capDuration
  ;

changeStatement: CHANGE_ target=identifier BY_ value=unitValue  # changeAllYears
  | CHANGE_ target=identifier BY_ value=unitValue duration=during  # changeDuration
  ;

defineVarStatement: DEFINE_ target=identifier AS_ value=expression;

emitStatement: EMIT_ value=unitValue  # emitAllYears
  | EMIT_ value=unitValue duration=during  # emitDuration
  ;

initialChageStatement: INITIAL_ CHARGE_ WITH_ value=expression  # initialChargeAllYears
  | INITIAL_ CHARGE_ WITH_ value=expression duration=during  # initialChargeDuration
  ;

rechargeStatement: RECHARGE_ population=unitValue WITH_ volume=unitValue  # rechargeAllYears
  | RECHARGE_ population=unitValue WITH_ volume=unitValue duration=during  # rechargeDuration
  ;

recoverStatement: RECOVER_ volume=unitValue WITH_ yield=unitValue REUSE_  # recoverAllYears
  | RECOVER_ valume=unitValue WITH_ yield=unitValue REUSE_ duration=during  # recoverDuration
  ;

replaceStatement: REPLACE_ volume=unitValue OF_ target=identifier WITH_ destination=string  # replaceAllYears
  | REPLACE_ volume=unitValue OF_ target=identifier WITH_ destination=string duration=during  # replaceDuration
  ;

retireStatement: RETIRE_ volume=unitValue  # retireAllYears
  | RETIRE_ volume=unitValue duration=during  # retireDuration
  ;

setStatement: SET_ target=identifier TO_ value=expression  # setAllYears
  | SET_ target=identifier TO_ value=expression duration=during  # setDuration
  | SET_ target=identifier TO_ value=expression  # setIdentifierAllYears
  | SET_ target=identifier TO_ value=expression duration=during  # setIdentifierDuration
  ;

simulate: SIMULATE_ name=string FROM_ YEARS_ start=expression TO_ end=expression  # baseSimulation
  | SIMULATE_ name=string USING_ policy=string FROM_ YEARS_ start=expression TO_ end=expression  # singlePolicySim
  | SIMULATE_ name=string USING_ string (THEN_ string)+ FROM_ YEARS_ start=expression TO_ end=expression  # multiPolicySim
  ;

/**
 * ---------------------
 * -- Statement types --
 * ---------------------
 **/

globalStatement: (defineVarStatement | setStatement);

substanceStatement: (capStatement | changeStatement | emitStatement | initialChageStatement | rechargeStatement | recoverStatement | replaceStatement | retireStatement);
