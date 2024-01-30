import { describe, expect, it } from 'vitest'

import { Constant, Or, Variable } from './index'

describe('Boolean Algebra', () => {
  it('should be Or of A + 1 = 1 be true', () => {
    const or = new Or(new Variable('A'), new Constant(true)).simplifyPossibilities()
    expect(or.length).toBe(1)
    expect(or[0]).toBeInstanceOf(Constant)
    if (or[0] instanceof Constant) {
      expect(or[0].value).toBe(true)
    }
  })
  it('should be Or of A + 0 = A be true', () => {
    const or = new Or(new Variable('A'), new Constant(false)).simplifyPossibilities()
    expect(or.length).toBe(1)
    expect(or[0]).toBeInstanceOf(Variable)
    if (or[0] instanceof Variable) {
      expect(or[0].identifier).toBe('A')
    }
  })
  it('should be Or of A + A = A be true', () => {
    const or = new Or(new Variable('A'), new Variable('A')).simplifyPossibilities()
    expect(or.length).toBe(1)
    expect(or[0]).toBeInstanceOf(Variable)
    if (or[0] instanceof Variable) {
      expect(or[0].identifier).toBe('A')
    }
  })
  it('should be Or of A + !A = 1 be true', () => {
    const or = new Or(new Variable('A'), new Variable('A', true)).simplifyPossibilities()
    expect(or.length).toBe(1)
    expect(or[0]).toBeInstanceOf(Constant)
    if (or[0] instanceof Constant) {
      expect(or[0].value).toBe(true)
    }
  })
  it('should be Or of A + !A + B = 1 be true', () => {
    const or = new Or(new Variable('A'), new Variable('A', true), new Variable('B')).simplifyPossibilities()
    expect(or.length).toBe(1)
    expect(or[0]).toBeInstanceOf(Constant)
    if (or[0] instanceof Constant) {
      expect(or[0].value).toBe(true)
    }
  })
  it('should be Or of A + !A + !B = 1 be true', () => {
    const or = new Or(new Variable('A'), new Variable('A', true), new Variable('B', true)).simplifyPossibilities()
    expect(or.length).toBe(1)
    expect(or[0]).toBeInstanceOf(Constant)
    if (or[0] instanceof Constant) {
      expect(or[0].value).toBe(true)
    }
  })
  it('should be Or of A + !A + B + !B = 1 be true', () => {
    const or = new Or(
      new Variable('A'),
      new Variable('A', true),
      new Variable('B'),
      new Variable('B', true)
    ).simplifyPossibilities()
    expect(or.length).toBe(1)
    expect(or[0]).toBeInstanceOf(Constant)
    if (or[0] instanceof Constant) {
      expect(or[0].value).toBe(true)
    }
  })
  it('should be Or of A + !A + B + !B + C = 1 be true', () => {
    const or = new Or(
      new Variable('A'),
      new Variable('A', true),
      new Variable('B'),
      new Variable('B', true),
      new Variable('C')
    ).simplifyPossibilities()
    expect(or.length).toBe(1)
    expect(or[0]).toBeInstanceOf(Constant)
    if (or[0] instanceof Constant) {
      expect(or[0].value).toBe(true)
    }
  })
  it('should be Or of A + (A + B) = A + B be true', () => {
    const or = new Or(new Variable('A'), new Or(new Variable('A'), new Variable('B'))).simplifyPossibilities()
    expect(or.length).toBe(1)
    expect(or[0]).toBeInstanceOf(Or)
    if (or[0] instanceof Or) {
      expect(or[0].expressions.length).toBe(2)
      expect(or[0].expressions[0]).toBeInstanceOf(Variable)
      expect(or[0].expressions[1]).toBeInstanceOf(Variable)
      if (or[0].expressions[0] instanceof Variable) {
        expect(or[0].expressions[0].identifier).toBe('A')
      }
      if (or[0].expressions[1] instanceof Variable) {
        expect(or[0].expressions[1].identifier).toBe('B')
      }
    }
  })
  it('should be Or of A + (A + B) + C = A + B + C be true', () => {
    const or = new Or(
      new Variable('A'),
      new Or(new Variable('A'), new Variable('B')),
      new Variable('C')
    ).simplifyPossibilities()
    console.log(or)
    expect(or.length).toBe(1)
    expect(or[0]).toBeInstanceOf(Or)
    if (or[0] instanceof Or) {
      expect(or[0].expressions.length).toBe(3)
      expect(or[0].expressions[0]).toBeInstanceOf(Variable)
      expect(or[0].expressions[1]).toBeInstanceOf(Variable)
      expect(or[0].expressions[2]).toBeInstanceOf(Variable)
      if (or[0].expressions[0] instanceof Variable) {
        expect(or[0].expressions[0].identifier).toBe('A')
      }
      if (or[0].expressions[1] instanceof Variable) {
        expect(or[0].expressions[1].identifier).toBe('B')
      }
      if (or[0].expressions[2] instanceof Variable) {
        expect(or[0].expressions[2].identifier).toBe('C')
      }
    }
  })
})
