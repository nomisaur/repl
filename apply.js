export const apply = (procedure, args) => {
  if (isPrimitiveProcedure(procedure)) {
    return applyPrimitiveProcedure(procedure, args);
  }
  if (isCompoundProcedure(procedure)) {
    return evalSequence(
      procedureBody(procedure),
      extendEnv(procedureParams(procedure), args, procedureEnv(procedure))
    );
  }
  throw Error("Apply error, unknown procedure", procedure);
};
