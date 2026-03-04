grammar Zerow

entry Program:
    units+=UnitDeclaration*
    stmt+=(VariableDeclaration | Assignment)
    returns+=ReturnStatement*;

UnitDeclaration:
    'unit' name=ID;

VariableDeclaration:
    'declare' name=ID 'equals' value=Expression;

Assignment:
    'assign' value=Expression 'to' target=[VariableDeclaration:ID];

ReturnStatement:
    'returns' expression=Expression;

Expression infers Expression:
    AdditiveExpression;

AdditiveExpression infers Expression:
    MultiplicativeExpression ({infer BinaryExpression.left=current} operator=('add'|'sub') right=MultiplicativeExpression)*;

MultiplicativeExpression infers Expression:
    PrimaryExpression ({infer BinaryExpression.left=current} operator=('mul'|'div') right=PrimaryExpression)*;

PrimaryExpression infers Expression:
    Literal | VariableReference | GroupExpression | Negation;

Literal:
    value=INT '[' unit=[UnitDeclaration:ID] ']';

VariableReference:
    ref=[VariableDeclaration:ID];

GroupExpression:
    '(' expression=Expression ')';

Negation:
    'neg' expression=PrimaryExpression;

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
