export type Expression = Variable | Constant | Not | And | Or | Xor | NXor

export class Variable {
  name: string
  constructor(name: string) {
    this.name = name
  }

  toString() {
    return this.name
  }

  reduce(): Expression {
    return this
  }
}

export class Constant {
  value: boolean
  constructor(value: boolean) {
    this.value = value
  }

  toString() {
    return this.value ? '1' : '0'
  }

  reduce(): Expression {
    return this
  }
}

export class Not {
  expression: Expression
  constructor(expression: Expression) {
    this.expression = expression
  }

  reduce(): Expression {
    if (this.expression instanceof Constant) {
      return new Constant(!this.expression.value)
    }

    if (this.expression instanceof Not) {
      return this.expression.expression
    }
    if (this.expression instanceof And) {
      if (this.expression.expressions.length === 2) {
        const [left, right] = this.expression.expressions
        if (left instanceof Not && right instanceof Not) {
          if (left.expression instanceof And && right.expression instanceof And) {
            if (left.toString() === right.toString()) {
              // ~(~(A · B) · ~(A · B)) = A · B
              return left.expression
            }
            // ~(~(A · A) · ~(B · B)) = A + B
            const leftAnd = left.expression.expressions
            const rightAnd = right.expression.expressions
            if (leftAnd[0].toString() === leftAnd[1].toString() && rightAnd[0].toString() === rightAnd[1].toString()) {
              return new Or(leftAnd[0], rightAnd[0])
            }
          }
          return new And(left.expression, right.expression)
        }
        if (left instanceof Not) {
          // ~(~(A · B) · C) = ~A + C
          return new Or(left.expression, right)
        }
        if (right instanceof Not) {
          // ~(A · ~(A · B)) = ~A + B
          return new Or(left, right.expression)
        }
        // ~(A · B) = ~A + ~B
        return new Or(new Not(left), new Not(right))
      }
    }
    if (this.expression instanceof Or) {
      if (this.expression.expressions.length === 2) {
        const [left, right] = this.expression.expressions
        // ~(~(A + B) + ~(A + B)) = A + B
        if (left instanceof Not && right instanceof Not) {
          return new Or(left.expression, right.expression)
        }
        if (left instanceof Not) {
          // ~(~(A + B) + C) = ~A · C
          return new And(left.expression, right)
        }
        if (right instanceof Not) {
          // ~(A + ~(A + B)) = ~A · B
          return new And(left, right.expression)
        }
        // ~(A + B) = ~A · ~B
        return new And(new Not(left), new Not(right))
      }
    }
    // ~(A·B) = ~A + ~B
    if (this.expression instanceof And) {
      return new Or(...this.expression.expressions.map(e => new Not(e)))
    }
    // ~(A + B) = ~A · ~B
    if (this.expression instanceof Or) {
      return new And(...this.expression.expressions.map(e => new Not(e)))
    }

    return this
  }

  toString(): string {
    return `~(${this.expression.toString()})`
  }
}

export class And {
  expressions: Expression[]

  constructor(...expressions: Expression[]) {
    this.expressions = expressions
  }

  toString(): string {
    return `(${this.expressions.map(e => e.toString()).join(' · ')})`
  }

  reduce(): Expression {
    if (this.expressions.length === 2) {
      const [left, right] = this.expressions
      // (A · A) = A
      if (left.toString() === right.toString()) {
        return left
      }
      // (A · ~A) = 0
      if (left instanceof Not && left.expression.toString() === right.toString()) {
        return new Constant(false)
      }
      // (~A · A) = 0
      if (right instanceof Not && right.expression.toString() === left.toString()) {
        return new Constant(false)
      }
      // (A · 1) = A
      if (left instanceof Constant && left.value) {
        return right
      }
      // (1 · A) = A
      if (right instanceof Constant && right.value) {
        return left
      }
      // (A · 0) = 0
      if (left instanceof Constant && !left.value) {
        return left
      }
      // (0 · A) = 0
      if (right instanceof Constant && !right.value) {
        return right
      }
    }

    return this
  }
}

export class Or {
  expressions: Expression[]

  constructor(...expressions: Expression[]) {
    this.expressions = expressions
  }

  toString(): string {
    return `(${this.expressions.map(e => e.toString()).join(' + ')})`
  }

  reduce(): Expression {
    if (this.expressions.length === 2) {
      const [left, right] = this.expressions
      // (A + A) = A
      if (left.toString() === right.toString()) {
        return left
      }
      // (A + ~A) = 1
      if (left instanceof Not && left.expression.toString() === right.toString()) {
        return new Constant(true)
      }
      // (~A + A) = 1
      if (right instanceof Not && right.expression.toString() === left.toString()) {
        return new Constant(true)
      }
      // (A + 0) = A
      if (left instanceof Constant && !left.value) {
        return right
      }
      // (0 + A) = A
      if (right instanceof Constant && !right.value) {
        return left
      }
      // (A + 1) = 1
      if (left instanceof Constant && left.value) {
        return left
      }
      // (1 + A) = 1
      if (right instanceof Constant && right.value) {
        return right
      }
      // A + AB = A
      if (left instanceof And && left.expressions.length === 2) {
        const [leftLeft, leftRight] = left.expressions
        if (leftLeft.toString() === right.toString()) {
          return right
        }
        if (leftRight.toString() === right.toString()) {
          return right
        }
      }
      // AB + A = A
      if (right instanceof And && right.expressions.length === 2) {
        const [rightLeft, rightRight] = right.expressions
        if (rightLeft.toString() === left.toString()) {
          return left
        }
        if (rightRight.toString() === left.toString()) {
          return left
        }
      }
    }
    return this
  }
}

export class Xor {
  left: Expression
  right: Expression

  constructor(left: Expression, right: Expression) {
    this.left = left
    this.right = right
  }

  toString(): string {
    return `(${this.left.toString()} ⊕ ${this.right.toString()})`
  }

  toAndOr(): And | Or {
    return new Or(new And(this.left, new Not(this.right)), new And(new Not(this.left), this.right))
  }

  reduce(): Expression {
    return this.toAndOr().reduce()
  }
}

export class NXor {
  left: Expression
  right: Expression

  constructor(left: Expression, right: Expression) {
    this.left = left
    this.right = right
  }

  toString(): string {
    return `~(${this.left.toString()} ⊕ ${this.right.toString()})`
  }

  toAndOr(): And | Or {
    return new Or(new And(this.left, this.right), new And(new Not(this.left), new Not(this.right)))
  }

  reduce(): Expression {
    return this.toAndOr().reduce()
  }
}

/*
3.5  Precedência entre Operadores 
  As regras de precedência de operações são simples:
    1. A negação de uma variável sempre avaliada primeiro;
    2. Expressões Booleanas devem ser avaliadas preferencialmente da esquerda para a direita;
    3. Negação de mais de uma variável avaliada apenas após a operação ou operações que estão sendo avaliadas;
    4. As operações OU e E possuem a mesma ordem de precedência;
    5. A ordem de avaliação pode ser alterada por meio da utilização de parênteses.
Exemplo 3.3. 
  ((ABC) + (~(A)~(BC)))⊕~(~(AD) + ~(D⊕A))
  1. A·B
  2. (A·B)·C
  3. ~A
  4. B·C
  5. ~A·(B·C)
  6. ((A·B)·C) + (~A·~(B·C))
  7. A·D
  8. ~(A·D)
  9. A⊕D
  10. ~(A⊕D)
  11. ~(A·D) + ~(A⊕D)
  12.(A·D) + (A⊕D)
  13. ((ABC) + (~(A)~(BC)))⊕~(~(AD) + ~(D⊕A))
*/

export class FunctionBoolean {
  expressions: Expression[]
  constructor(...expressions: Expression[]) {
    this.expressions = expressions
  }

  toString(): string {
    return `(${this.expressions.map(e => e.toString()).join(' ')})`
  }
}
