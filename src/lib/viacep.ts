/**
 * Cliente para integração com a API ViaCEP
 * Documentação: https://viacep.com.br/
 */

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

/**
 * Busca informações de endereço pelo CEP usando a API ViaCEP
 * @param cep CEP no formato 12345678 ou 12345-678
 * @returns Dados do endereço ou null se não encontrado
 */
export async function buscarCep(cep: string): Promise<ViaCepResponse | null> {
  // Remove formatação do CEP
  const cepLimpo = cep.replace(/\D/g, "");
  
  // Valida se tem 8 dígitos
  if (cepLimpo.length !== 8) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    
    if (!response.ok) {
      return null;
    }

    const data: ViaCepResponse = await response.json();
    
    // ViaCEP retorna { erro: true } quando não encontra o CEP
    if (data.erro) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    return null;
  }
}
