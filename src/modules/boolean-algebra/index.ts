// criar um simplificador de expressões

export type Expression = Variable | Constant | And | Or | Not

class Variable {
  identifier: string
  isNegated: boolean

  constructor(identifier: string, isNegated?: boolean) {
    this.identifier = identifier
    this.isNegated = isNegated || false
  }
}

class Constant {
  value: boolean

  singleIdentifier(): string {
    return this.value ? '1' : '0'
  }

  constructor(value: boolean) {
    this.value = value
  }
}

class Not {
  expression: Expression

  constructor(expression: Expression) {
    this.expression = expression
  }

  singleIdentifier(): string {
    if (this.expression instanceof Variable) {
      return `!(${this.expression.identifier})`
    }
    return this.expression.singleIdentifier()
  }

  simplifyPossibilities(): Expression[] {
    const possibilities: Expression[] = [this]
    // !0 = 1
    if (this.expression instanceof Constant) {
      possibilities.push(new Constant(!this.expression.value))
    }
    // !!A = A
    if (this.expression instanceof Variable) {
      possibilities.push(new Variable(this.expression.identifier, !this.expression.isNegated))
    }
    // !!A = A
    if (this.expression instanceof Not) {
      possibilities.push(this.expression.expression)
    }
    // !De Morgan's laws -> !(A . B) = !A + !B
    if (this.expression instanceof And) {
      possibilities.push(new Or(...this.expression.expressions.map(expression => new Not(expression))))
    }
    // !De Morgan's laws -> !(A + B) = !A . !B
    if (this.expression instanceof Or) {
      possibilities.push(new And(...this.expression.expressions.map(expression => new Not(expression))))
    }
    return possibilities
  }
}

class Or {
  expressions: Expression[]

  constructor(...expressions: Expression[]) {
    this.expressions = expressions
  }

  singleIdentifier(): string {
    return this.expressions.reduce((acc, expression) => {
      if (expression instanceof Variable) {
        return acc + expression.identifier
      }
      return acc + expression.singleIdentifier()
    }, '')
  }

  simplifyPossibilities(): Expression[] {
    for (const expression of this.expressions) {
      if (expression instanceof Constant) {
        if (expression.value) {
          return [expression]
        }
      }
    }
    const possibilities: Expression[] = []
    // A + B + C + D = (A + B) + (C + D) = (A + C) + (B + D) = (A + D) + (B + C)
    if (this.expressions.length === 0) {
      return [new Constant(false)]
    }
    // A = A
    if (this.expressions.length === 1) {
      if (this.expressions[0] instanceof Constant || this.expressions[0] instanceof Variable) {
        return [this.expressions[0]]
      }
      return this.expressions[0].simplifyPossibilities()
    }
    if (this.expressions.length === 2) {
      const left = this.expressions[0]
      const right = this.expressions[1]
      if (left instanceof Constant && right instanceof Constant) {
        return [new Constant(left.value || right.value)]
      }
      if (left instanceof Variable && right instanceof Variable) {
        if (left.identifier === right.identifier) {
          if (left.isNegated === right.isNegated) {
            return [left]
          }
          return [new Constant(true)]
        }
      }
      if (left instanceof Variable && right instanceof Not) {
        // A + !A = 1
        if (right.expression instanceof Variable && left.identifier === right.expression.identifier) {
          return [new Constant(true)]
        }

        // A + !B = !(A . B)
        possibilities.push(new Not(new And(left, right.expression)))
      } else if (left instanceof Not && right instanceof Variable) {
        // !A + B = !(A . B)
        if (left.expression instanceof Variable && left.expression.identifier === right.identifier) {
          return [new Constant(true)]
        }

        // !A + B = !(A . B)
        possibilities.push(new Not(new And(left.expression, right)))
      }
      if (left instanceof Constant) {
        // A + 0 = A
        if (left.value) {
          return [left]
        }
        possibilities.push(right)
      }

      if (right instanceof Constant) {
        // A + 1 = 1
        if (right.value) {
          return [right]
        }
        return [left]
      }

      if (left instanceof Variable && right instanceof And) {
        // A + (B . C) = (A + B) . (A + C)
        possibilities.push(new And(new Or(left, right.expressions[0]), new Or(left, right.expressions[1])))
      } else if (left instanceof And && right instanceof Variable) {
        // (A . B) + C = (A + C) . (B + C)
        possibilities.push(new And(new Or(left.expressions[0], right), new Or(left.expressions[1], right)))
      }

      if (left instanceof Not && right instanceof Not) {
        possibilities.push(new Not(new And(left.expression, right.expression)))
      }

      if (left instanceof Variable && right instanceof Or) {
        // A + (A + B) = A + B
        if (
          right.expressions.some(
            expression => expression instanceof Variable && expression.identifier === left.identifier
          )
        ) {
          return [right]
        }
        // A + (B + C) = A + B + C
        return new Or(left, ...right.expressions).simplifyPossibilities()
      }
    } else {
      // A + B + C + D = (A + B) + (C + D) = (A + C) + (B + D) = (A + D) + (B + C) = ...
      for (let i = 0; i < this.expressions.length; i++) {
        const expression = this.expressions[i]
        if (expression instanceof Constant) {
          if (expression.value) {
            return [expression]
          }
          continue
        }
        const pares: Expression[] = []
        for (let j = i + 1; j < this.expressions.length; j++) {
          const par = new Or(this.expressions[i], this.expressions[j])
          pares.push(...par.simplifyPossibilities())
        }
        const paresPossibilities: Expression[] = new Or(...pares).simplifyPossibilities()
        for (const par of paresPossibilities) {
          if (par instanceof Constant) {
            if (par.value) {
              return [par]
            }
          }
        }
        possibilities.push(...paresPossibilities)
      }
    }
    return possibilities
  }

  // simplifyPossibilities(): Expression[] {
  //   const possibilities: Expression[] = [this]
  //   if (this.left instanceof Constant && this.right instanceof Constant) {
  //     possibilities.push(new Constant(this.left.value || this.right.value))
  //   }
  //   if (this.left instanceof Variable && this.right instanceof Variable) {
  //     if (this.left.identifier === this.right.identifier) {
  //       if (this.left.isNegated === this.right.isNegated) {
  //         possibilities.push(this.left)
  //       } else {
  //         possibilities.push(new Constant(true))
  //       }
  //     }
  //   }
  //   if (this.left instanceof Variable && this.right instanceof And) {
  //     // A + (B . C) = (A + B) . (A + C)
  //     possibilities.push(new And(new Or(this.left, this.right.left), new Or(this.left, this.right.right)))
  //   } else if (this.left instanceof And && this.right instanceof Variable) {
  //     // (A . B) + C = (A + C) . (B + C)
  //     possibilities.push(new And(new Or(this.left.left, this.right), new Or(this.left.right, this.right)))
  //   }

  //   if (this.left instanceof Constant) {
  //     // A + 0 = A
  //     if (this.left.value) {
  //       possibilities.push(this.left)
  //     } else {
  //       possibilities.push(this.right)
  //     }
  //   }

  //   if (this.right instanceof Constant) {
  //     // A + 1 = 1
  //     if (this.right.value) {
  //       possibilities.push(this.right)
  //     } else {
  //       possibilities.push(this.left)
  //     }
  //   }

  //   if (this.left instanceof Not && this.right instanceof Not) {
  //     possibilities.push(new Not(new And(this.left.expression, this.right.expression)))
  //   }

  //   return possibilities
  // }
}

class And {
  expressions: Expression[]

  constructor(...expressions: Expression[]) {
    this.expressions = expressions
  }

  singleIdentifier(): string {
    return this.expressions.reduce((acc, expression) => {
      if (expression instanceof Variable) {
        return acc + expression.identifier
      }
      return acc + expression.singleIdentifier()
    }, '')
  }

  simplifyPossibilities(): Expression[] {
    const possibilities: Expression[] = [this]
    // A . B . C . D = (A . B) . (C . D) = (A . C) . (B . D) = (A . D) . (B . C)
    if (this.expressions.length === 0) {
      return [new Constant(true)]
    }
    // A = A
    if (this.expressions.length === 1) {
      if (this.expressions[0] instanceof Constant || this.expressions[0] instanceof Variable) {
        return [this.expressions[0]]
      }
      return this.expressions[0].simplifyPossibilities()
    }
    if (this.expressions.length === 2) {
      const left = this.expressions[0]
      const right = this.expressions[1]
      if (left instanceof Constant && right instanceof Constant) {
        possibilities.push(new Constant(left.value && right.value))
      }
      if (left instanceof Variable && right instanceof Variable) {
        if (left.identifier === right.identifier) {
          if (left.isNegated === right.isNegated) {
            possibilities.push(left)
          } else {
            possibilities.push(new Constant(false))
          }
        }
      }
      if (left instanceof Variable && right instanceof Or) {
        // A . (B + C) = (A . B) + (A . C)
        possibilities.push(new Or(new And(left, right.expressions[0]), new And(left, right.expressions[1])))
      } else if (left instanceof Or && right instanceof Variable) {
        // (A + B) . C = (A . C) + (B . C)
        possibilities.push(new Or(new And(left.expressions[0], right), new And(left.expressions[1], right)))
      }

      if (left instanceof Constant) {
        if (left.value) {
          possibilities.push(right)
        } else {
          possibilities.push(left)
        }
      }

      if (right instanceof Constant) {
        if (right.value) {
          possibilities.push(left)
        } else {
          possibilities.push(right)
        }
      }

      if (left instanceof Not && right instanceof Not) {
        possibilities.push(new Not(new Or(left.expression, right.expression)))
      }
    } else {
      // A . B . C . D = (A . B) . (C . D) = (A . C) . (B . D) = (A . D) . (B . C) = ...
      const left = new And(...this.expressions.slice(0, this.expressions.length / 2))
      const right = new And(...this.expressions.slice(this.expressions.length / 2))
      possibilities.concat(new And(left, right).simplifyPossibilities())
    }
    return possibilities
  }

  // simplifyPossibilities(): Expression[] {
  //   const possibilities: Expression[] = [this]
  //   if (this.left instanceof Constant && this.right instanceof Constant) {
  //     possibilities.push(new Constant(this.left.value && this.right.value))
  //   }
  //   if (this.left instanceof Variable && this.right instanceof Variable) {
  //     if (this.left.identifier === this.right.identifier) {
  //       if (this.left.isNegated === this.right.isNegated) {
  //         possibilities.push(this.left)
  //       } else {
  //         possibilities.push(new Constant(false))
  //       }
  //     }
  //   }
  //   if (this.left instanceof Variable && this.right instanceof Or) {
  //     // A . (B + C) = (A . B) + (A . C)
  //     possibilities.push(new Or(new And(this.left, this.right.left), new And(this.left, this.right.right)))
  //   } else if (this.left instanceof Or && this.right instanceof Variable) {
  //     // (A + B) . C = (A . C) + (B . C)
  //     possibilities.push(new Or(new And(this.left.left, this.right), new And(this.left.right, this.right)))
  //   }

  //   if (this.left instanceof Constant) {
  //     if (this.left.value) {
  //       possibilities.push(this.right)
  //     } else {
  //       possibilities.push(this.left)
  //     }
  //   }

  //   if (this.right instanceof Constant) {
  //     if (this.right.value) {
  //       possibilities.push(this.left)
  //     } else {
  //       possibilities.push(this.right)
  //     }
  //   }

  //   if (this.left instanceof Not && this.right instanceof Not) {
  //     possibilities.push(new Not(new Or(this.left.expression, this.right.expression)))
  //   }

  //   return possibilities
  // }
}

export { And, Constant, Not, Or, Variable }
