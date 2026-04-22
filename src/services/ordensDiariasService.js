import maestroApi from './maestroApi';

export async function getOrdensDiarias(dataInicio, dataFim) {
  const params = new URLSearchParams();
  if (dataInicio) params.set('dataInicio', dataInicio);
  if (dataFim) params.set('dataFim', dataFim);
  const res = await maestroApi.get(`/ordens-diarias?${params}`);
  return res.data;
}

export async function createOrdemDiaria(ordem) {
  const res = await maestroApi.post('/ordens-diarias', ordem);
  return res.data;
}

export async function updateOrdemDiaria(id, ordem) {
  const res = await maestroApi.put(`/ordens-diarias/${id}`, ordem);
  return res.data;
}

export async function deleteOrdemDiaria(id) {
  const res = await maestroApi.delete(`/ordens-diarias/${id}`);
  return res.data;
}
