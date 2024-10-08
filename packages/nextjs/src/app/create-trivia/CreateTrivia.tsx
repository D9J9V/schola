"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TriviaFactory } from "../../../contracts/lib"; // Asegúrate de que la ruta sea correcta
import { GearApi } from "@gear-js/api";
import { useAccount } from "@gear-js/react-hooks";
import { web3FromSource } from "@polkadot/extension-dapp";
import { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(
    () => {
      alert("Trivia ID copied to clipboard!");
    },
    (err) => {
      console.error("Could not copy text: ", err);
    },
  );
};

export default function CrearPregunta() {
  const [isLoading, setIsLoading] = useState(false);
  const [preguntas, setPreguntas] = useState([
    { pregunta: "", respuestaCorrecta: "" },
  ]);
  const [reward, setReward] = useState("");
  const [triviaId, setTriviaId] = useState<number | null>(null);
  const router = useRouter();
  const { account } = useAccount();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        alert("Trivia ID copied to clipboard!");
      },
      (err) => {
        console.error("Could not copy text: ", err);
      },
    );
  };

  const handlePreguntaChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nuevasPreguntas = [...preguntas];
    nuevasPreguntas[index].pregunta = event.target.value;
    setPreguntas(nuevasPreguntas);
  };

  const handleRespuestaCorrectaChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nuevasPreguntas = [...preguntas];
    nuevasPreguntas[index].respuestaCorrecta = event.target.value;
    setPreguntas(nuevasPreguntas);
  };

  const handleAddQuestion = () => {
    setPreguntas([...preguntas, { pregunta: "", respuestaCorrecta: "" }]);
  };

  const handleRewardChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReward(event.target.value);
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (!account) {
      alert("Please connect your wallet first");
      return;
    }
    setIsLoading(true);
    try {
      const api = await GearApi.create({
        providerAddress: "wss://testnet.vara.network",
      });

      // Get the extension from the account's source
      const injector = await web3FromSource(
        (account as InjectedAccountWithMeta).meta.source,
      );

      // Set the signer for the api
      api.setSigner(injector.signer as any);

      const triviaFactory = new TriviaFactory(
        api,
        "0xf5691c64eed986728bc5a263851b78ba867522289078b07ade779ca25f711b8b",
      );

      const questions = preguntas.map((p) => p.pregunta);
      const answers = preguntas.map((p) => p.respuestaCorrecta);

      const rewardValue = BigInt(reward);

      const createTriviaMessage = triviaFactory.triviaFactory.createTrivia(
        questions,
        answers,
      );

      // Set the account and value
      await createTriviaMessage
        .withAccount(account.address)
        .withValue(rewardValue);

      // Calculate gas (optional, but recommended)
      await createTriviaMessage.calculateGas();

      // Sign and send the transaction
      const result = await createTriviaMessage.signAndSend();

      const isFinalized = await result.isFinalized;

      if (isFinalized) {
        const response = await result.response();
        if (response && typeof response === "object" && "ok" in response) {
          const okResult = response.ok;
          if (typeof okResult === "number") {
            setTriviaId(okResult);
            const modalElement = document.getElementById(
              "my_modal_1",
            ) as HTMLDialogElement;
            if (modalElement) {
              modalElement.showModal();
            }
          }
        } else if (
          response &&
          typeof response === "object" &&
          "err" in response
        ) {
          console.error("Error creating trivia:", response.err);
          alert(`Error creating trivia: ${response.err}`);
        } else {
          console.error("Unexpected response structure:", response);
          alert("Unexpected error occurred");
        }
      } else {
        alert("Transaction was not finalized");
      }
    } catch (error) {
      console.error("Error creating trivia:", error);
      alert(`Error creating trivia: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="grid grid-cols-2">
        <h1 className="text-3xl font-bold mb-6">Create new trivia</h1>
        <button className="btn justify-self-end">Fund a trivia game</button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        {preguntas.map((preguntaObj, index) => (
          <div key={index}>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor={`pregunta-${index}`}
              >
                Question {index + 1}:
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id={`pregunta-${index}`}
                type="text"
                placeholder="Write your question here"
                value={preguntaObj.pregunta}
                onChange={(event) => handlePreguntaChange(index, event)}
                required
              />
            </div>

            <div className="mb-6">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor={`respuestaCorrecta-${index}`}
              >
                Correct answer {index + 1}:
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id={`respuestaCorrecta-${index}`}
                type="text"
                placeholder="Write the correct answer"
                value={preguntaObj.respuestaCorrecta}
                onChange={(event) =>
                  handleRespuestaCorrectaChange(index, event)
                }
                required
              />
            </div>
          </div>
        ))}

        <div className="mb-6">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="reward"
          >
            Reward (in tokens):
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="reward"
            type="number"
            placeholder="Enter reward amount"
            value={reward}
            onChange={handleRewardChange}
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            className="btn btn-lg mt-10 btn-glass mb-5"
            onClick={handleAddQuestion}
          >
            Add Question
          </button>
          <button
            type="submit"
            className="btn btn-lg mt-10 btn-glass mb-5"
            disabled={isLoading}
          >
            {isLoading ? "Creating Trivia..." : "Create Trivia"}
          </button>
        </div>
      </form>

      <dialog id="my_modal_1" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Trivia Created!</h3>
          <p className="py-4">Your trivia has been created successfully.</p>
          <div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg my-4">
            <span className="text-2xl font-semibold">
              Trivia ID: {triviaId}
            </span>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => copyToClipboard(triviaId!.toString())}
            >
              Copy ID
            </button>
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button
                className="btn"
                onClick={() => router.push("/play-trivia")}
              >
                Go to Play Trivia
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
}
