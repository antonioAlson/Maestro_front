import { useState } from "react";

export function TestBody() {
  const [inputs, setInputs] = useState({});
  const [loadingPdf, setLoadingPdf] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setInputs((values) => ({ ...values, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoadingPdf(true);

    const queryParams = new URLSearchParams({
      material: inputs.material || "",
      process: inputs.process || "",
      plateBatch: inputs.plateBatch || "",
      plastic: inputs.plastic || "",
      plasticBatch: inputs.plasticBatch || "",
      cloth: inputs.cloth || "",
      clothBatch: inputs.clothBatch || "",
      required: inputs.required || "",
      observation: inputs.observation || "",
    }).toString();

    const pdfUrl = `https://shinejoias.shop/etiqueta2?${queryParams}`;

    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = blobUrl;

      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        }, 500);
      };

      document.body.appendChild(iframe);

      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
      }, 50000);
    } catch (error) {
      console.error("Erro ao gerar o PDF:", error);
      alert("Erro ao gerar o PDF!");
    } finally {
      setLoadingPdf(false);
    }
  };

  return (
    <div className="flex flex-col items-center dashboard-container">
      <div className="section-background section-background-size">
        <div>
          <h2 className="text-xl mb-6">Etiqueta de Validação Engenharia</h2>
          <form
            className="grid grid-cols-2 gap-4 mb-6 section-inputs-create"
            onSubmit={handleSubmit}
          >
            <div className="line-inputs">
              <div className="input-align">
                <p className="input-top-placeholder">Material</p>
                <input
                  type="text"
                  name="material"
                  placeholder="Material"
                  className="inputs-placeholder"
                  value={inputs.material || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-align">
                <p className="input-top-placeholder">Lote da Placa</p>
                <input
                  type="text"
                  name="plateBatch"
                  placeholder="Lote da Placa"
                  className="inputs-placeholder"
                  value={inputs.plateBatch || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-align">
                <p className="input-top-placeholder">Solicitante do Teste</p>
                <input
                  type="text"
                  name="required"
                  placeholder="Solicitante do Teste"
                  className="inputs-placeholder"
                  value={inputs.required || ""}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="line-inputs">
            </div>
            <div className="line-inputs">
              <div className="input-align">
                <p className="input-top-placeholder">Filme (Plástico)</p>
                <input
                  type="text"
                  name="plastic"
                  placeholder="Plástico"
                  className="inputs-placeholder"
                  value={inputs.plastic || ""}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-align">
                <p className="input-top-placeholder">Lote do Plástico</p>
                <input
                  type="text"
                  name="plasticBatch"
                  placeholder="Lote do Plástico"
                  className="inputs-placeholder"
                  value={inputs.plasticBatch || ""}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="line-inputs">
              <div className="input-align">
                <p className="input-top-placeholder">Tecido</p>
                <input
                  type="text"
                  name="cloth"
                  placeholder="Tecido"
                  className="inputs-placeholder"
                  value={inputs.cloth || ""}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-align">
                <p className="input-top-placeholder">Lote do Tecido</p>
                <input
                  type="text"
                  name="clothBatch"
                  placeholder="Lote do Tecido"
                  className="inputs-placeholder"
                  value={inputs.clothBatch || ""}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="line-inputs col-span-2">
              <div className="input-align w-full">
                <p className="input-top-placeholder">Observação</p>
                <input
                  type="text"
                  name="observation"
                  placeholder="Observação"
                  className="inputs-placeholder w-full"
                  value={inputs.observation || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="input-align">
                <p className="input-top-placeholder">Processo</p>
                <input
                  type="text"
                  name="process"
                  placeholder="Processo"
                  className="inputs-placeholder"
                  value={inputs.process || ""}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <button
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-500 transition button-right"
              type="submit"
              disabled={loadingPdf}
            >
              {loadingPdf ? <div className="spinner"></div> : "Gerar Etiqueta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
