"use strict";
// to navigate using the current tree system
// you can go to parents, and children
Object.defineProperty(exports, "__esModule", { value: true });
// 
// natural = union zero (s natural)
// sum n zero = n
// sum n (s m) = s (sum n m)
// typing sum --> building a defName
// typing words after sum --> adding parameters
// typing = --> moving to the body of the def
// different ways of doing the same thing:
// writing definitions as universal statements that involve equality:
// doesn't necessarily make it clear that this is how sum is defined
// for all natural n, sum n zero = n
// for all natural n, m, sum n (s m) = s (sum n m)
// same as above, without explicitly declaring the parameters and their range
// (becomes pattern matching)
// sum n zero = n
// sum n (s m) = s (sum n m)
// explicitly a definition, with conditionals instead of patttern matching, 
// define sum n m
//   if (m = 0) n
//   if 
// it would be nice to represent these different forms with a single tree structure
// sum n zero = n
// sum n (s m) = s (sum n m)
// sum -- name of a function
// n, m   -- parameter or universally quantified variable (possibly restricted to natural numbers)
// zero -- name of a constant value
// s    -- name of a constructor :N -> N
// sum n zero = n
// equal (sum n zero) n
// for-all natural n (equal (sum n zero) n)
// for-all set parameter statement
// sum : N -> N -> N
// equal: N -> N -> bool
// or equal: N -> N -> statement
