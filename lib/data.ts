import mongoose, { Schema, model, models } from "mongoose";

// Modelo de exemplo — ajuste conforme sua coleção
const ExampleSchema = new Schema({
  name: { type: String, required: true },
  value: { type: Number, required: true },
});

const Example =
  models.Example || model("Example", ExampleSchema);

export async function getData() {
  return await Example.find({});
}
