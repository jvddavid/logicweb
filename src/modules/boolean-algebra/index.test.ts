import { describe, expect, it } from 'vitest'

import { And, Constant, Not, Or, Variable } from './index'

describe('Boolean Algebra', () => {
  it('should be Or of A + 1 = (A + 1)', () => {
    const or = new Or(new Variable('A'), new Constant(true))
    expect(or.toString()).toBe('(A + 1)')
  })
  it('should be And of A · 1 = (A · 1)', () => {
    const and = new And(new Variable('A'), new Constant(true))
    expect(and.toString()).toBe('(A · 1)')
  })
  it('should be Not of A = ~(A) be true', () => {
    const not = new Not(new Variable('A'))
    expect(not.toString()).toBe('~(A)')
  })
  it('should be ~(A · B) = ~A + ~B', () => {
    const not = new Not(new And(new Variable('A'), new Variable('B')))
    expect(not.reduce().toString()).toBe('(~(A) + ~(B))')
  })
  it('should be ~(A + B) = ~A · ~B', () => {
    const not = new Not(new Or(new Variable('A'), new Variable('B')))
    expect(not.reduce().toString()).toBe('(~(A) · ~(B))')
  })
  it('should be ~(~(A · B) · ~(A · B)) = A · B', () => {
    const not = new Not(
      new And(
        new Not(new And(new Variable('A'), new Variable('B'))),
        new Not(new And(new Variable('A'), new Variable('B')))
      )
    )
    expect(not.reduce().toString()).toBe('(A · B)')
  })
  it('should be ~(~(A · A) · ~(B · B)) = A + B', () => {
    const not = new Not(
      new And(
        new Not(new And(new Variable('A'), new Variable('A'))),
        new Not(new And(new Variable('B'), new Variable('B')))
      )
    )
    expect(not.reduce().toString()).toBe('(A + B)')
  })
})
