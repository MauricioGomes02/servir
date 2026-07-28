export interface IdGenerator<TId> {
  generate(): TId;
}
