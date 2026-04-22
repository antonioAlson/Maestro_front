import maestroApi from './maestroApi';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';

export async function getJiraIssues(semData = false, filters = {}) {
  const params = new URLSearchParams();
  if (semData) params.set('semData', 'true');
  if (filters.mantaBoard) params.set('mantaBoard', filters.mantaBoard);
  const res = await maestroApi.get(`/jira/issues?${params}`);
  return res.data;
}

export async function reprogramarEmMassa(ids, date) {
  const res = await maestroApi.post('/jira/reprogramar-massa', { ids, date });
  return res.data;
}

export async function reprogramarDatasComtec() {
  const res = await maestroApi.post('/jira/reprogramar-datas-comtec');
  return res.data;
}

export async function atualizarDatasIndividuais(updates) {
  const res = await maestroApi.post('/jira/atualizar-datas-individuais', { updates });
  return res.data;
}

export async function buscarArquivosPorIds(ids) {
  const res = await maestroApi.post('/jira/buscar-arquivos', { ids });
  return res.data;
}

export async function downloadArquivo(url) {
  const res = await maestroApi.get(url, { responseType: 'blob' });
  return res.data;
}

export async function gerarEspelhos(cardId, files, quantidade, quantidadeTampas, consumo, onProgress) {
  const formData = new FormData();
  formData.append('cardId', cardId);
  formData.append('quantidadePecas', String(quantidade));
  if (quantidadeTampas != null) formData.append('quantidadeTampas', String(quantidadeTampas));
  if (consumo?.c8) formData.append('consumo8C', consumo.c8);
  if (consumo?.c9) formData.append('consumo9C', consumo.c9);
  if (consumo?.c11) formData.append('consumo11C', consumo.c11);
  files.forEach((file) => formData.append('files', file));

  const res = await maestroApi.post('/jira/gerar-espelhos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  });
  return res.data;
}

export async function obterLogsEspelhos() {
  const res = await maestroApi.get('/jira/logs-espelhos');
  return res.data;
}

export async function listarProjetosEspelhos(params = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set('page', params.page);
  if (params.limit) q.set('limit', params.limit);
  if (params.filtro) q.set('filtro', params.filtro);
  if (params.ordenarPor) q.set('ordenarPor', params.ordenarPor);
  if (params.ordem) q.set('ordem', params.ordem);
  const res = await maestroApi.get(`/jira/projetos-espelhos?${q}`);
  return res.data;
}

export async function listarProjects(params = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.filtro) q.set('filtro', params.filtro);
  if (params.ordenarPor) q.set('ordenarPor', params.ordenarPor);
  if (params.ordem) q.set('ordem', params.ordem);
  const res = await maestroApi.get(`/jira/projects?${q}`);
  return res.data;
}

export async function criarProject(data) {
  const res = await maestroApi.post('/jira/projects', data);
  return res.data;
}

export async function obterProjectById(id) {
  const res = await maestroApi.get(`/jira/projects/${id}`);
  return res.data;
}

export async function atualizarProject(id, data) {
  const res = await maestroApi.put(`/jira/projects/${id}`, data);
  return res.data;
}

export async function clonarProject(id) {
  const res = await maestroApi.post(`/jira/projects/${id}/clone`);
  return res.data;
}

export async function excluirProject(id) {
  const res = await maestroApi.delete(`/jira/projects/${id}`);
  return res.data;
}

export async function obterMarcasUnicas() {
  const res = await maestroApi.get('/jira/projects/brands');
  return res.data?.data || [];
}

async function generateExcel(data, filename, onDownloadStart) {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Jira Cards');

  ws.columns = [
    { header: 'ID', key: 'ID', width: 12 },
    { header: 'Resumo', key: 'Resumo', width: 15 },
    { header: 'Status', key: 'Status', width: 20 },
    { header: 'SITUAÇÃO', key: 'SITUAÇÃO', width: 25 },
    { header: 'Veículo', key: 'Veículo', width: 20 },
    { header: 'DT. PREVISÃO ENTREGA', key: 'DT. PREVISÃO ENTREGA', width: 18 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3A5F' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    };
  });

  const HIGHLIGHT_BRANDS = ['land rover', 'toyota', 'jaguar'];
  const EXCLUDE_HIGHLIGHT = ['toyota rav4'];

  data.forEach((row) => {
    const excelRow = ws.addRow(row);
    const veiculo = String(row['Veículo'] || '').toLowerCase();
    const shouldHighlight = HIGHLIGHT_BRANDS.some((b) => veiculo.includes(b))
      && !EXCLUDE_HIGHLIGHT.some((e) => veiculo.includes(e));

    if (shouldHighlight) {
      excelRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      });
    }
    excelRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' },
      };
    });
  });

  if (onDownloadStart) onDownloadStart();

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'relatorio.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportJiraReport(onDownloadStart) {
  const res = await maestroApi.get('/jira/issues');
  if (!res.data?.success) throw new Error('Falha ao buscar issues do Jira');

  const rows = res.data.data.map((item) => ({
    ID: item.key,
    Resumo: item.resumo,
    Status: item.status,
    'SITUAÇÃO': item.situacao,
    'Veículo': item.veiculo,
    'DT. PREVISÃO ENTREGA': item.previsao,
  }));

  const now = new Date();
  const ts = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getFullYear()}`;
  await generateExcel(rows, `jira-relatorio-${ts}.xlsx`, onDownloadStart);
  return { success: true, message: 'Relatório gerado com sucesso!' };
}

export async function exportContecReport(onDownloadStart) {
  const res = await maestroApi.get('/jira/contec');
  if (!res.data?.success) throw new Error('Falha ao buscar issues CONTEC');

  const rows = res.data.data.map((item) => ({
    ID: item.key,
    Resumo: item.resumo,
    Status: item.status,
    'SITUAÇÃO': item.situacao,
    'Veículo': item.veiculo,
    'DT. PREVISÃO ENTREGA': item.previsao,
  }));

  const now = new Date();
  const ts = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getFullYear()}`;
  await generateExcel(rows, `contec-relatorio-${ts}.xlsx`, onDownloadStart);
  return { success: true, message: 'Relatório CONTEC gerado com sucesso!' };
}

export async function downloadPdfsAsZip(fileList, onProgress) {
  const BATCH = 15;
  const zip = new JSZip();
  let done = 0;

  for (let i = 0; i < fileList.length; i += BATCH) {
    const batch = fileList.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (file) => {
        try {
          const blob = await downloadArquivo(file.url);
          zip.file(`${file.cardId}_${file.name}`, blob);
        } catch {
          // skip failed files
        } finally {
          done++;
          if (onProgress) onProgress(done, fileList.length);
        }
      })
    );
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `arquivos-${Date.now()}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
