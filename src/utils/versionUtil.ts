import axios from 'axios';

export async function getVersion(host: string): Promise<string> {
  try {
    const response = await axios.get(`http://${host}/json/info`);
    return response.data.ver;
  } catch (error: unknown) {
    return 'unknown';
  }
}
