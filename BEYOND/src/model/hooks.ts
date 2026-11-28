/*
  Authored by Muhammad Shahwaiz Abbasi · 2026
  hooks.ts —> the two React-Redux hooks, already typed for our store.
  Presenters use these instead of the plain useSelector / useDispatch, so TypeScript knows
  the shape of the state and that dispatch accepts our thunks.
 */
// Load the two plain hooks from React-Redux.
import { useDispatch, useSelector } from "react-redux";

// Load the types of our store.
import type { AppDispatch, RootState } from "./store";

// useAppDispatch: the dispatch function that also understands our thunks.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

// useAppSelector: reads a value from our state, with the right types.
export const useAppSelector = useSelector.withTypes<RootState>();
