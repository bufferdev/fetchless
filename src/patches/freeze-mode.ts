import { AxiosResponse } from 'axios';

/**
 * FreezeModeExtension - Implémentation du mode gel de données pour Fetchless
 * Permet de geler temporairement les données d'une URL spécifique
 */
export class FreezeModeExtension {
  // Stockage des données gelées
  private freezeCache: Map<string, AxiosResponse> = new Map();

  /**
   * Gèle les données d'une URL spécifique
   * @param url L'URL à geler
   * @param cachedResponse Réponse en cache actuelle à geler
   */
  public freeze(url: string, cachedResponse: AxiosResponse): void {
    this.freezeCache.set(url, cachedResponse);
    console.log(`Données gelées pour ${url}`);
  }

  /**
   * Dégèle les données d'une URL spécifique
   * @param url L'URL à dégeler
   */
  public unfreeze(url: string): void {
    if (this.freezeCache.has(url)) {
      this.freezeCache.delete(url);
      console.log(`Données dégelées pour ${url}`);
    }
  }

  /**
   * Vérifie si une URL a des données gelées
   * @param url L'URL à vérifier
   * @returns Les données gelées ou null si aucune
   */
  public getFrozenResponse(url: string): AxiosResponse | null {
    return this.freezeCache.has(url) ? this.freezeCache.get(url)! : null;
  }
} 