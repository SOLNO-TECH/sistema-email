/**
 * Servicio para verificación real de DNS
 * Verifica registros MX, SPF, DKIM y DMARC
 */

import dns from "dns/promises";

interface DnsVerificationResult {
  mxVerified: boolean;
  mxRecord?: string;
  spfVerified: boolean;
  spfRecord?: string;
  dkimVerified: boolean;
  dkimRecord?: string;
  dmarcVerified: boolean;
  dmarcRecord?: string;
  allVerified: boolean;
}

class DnsVerificationService {
  /**
   * Verifica todos los registros DNS de un dominio
   */
  static async verifyDomain(domainName: string): Promise<DnsVerificationResult> {
    const result: DnsVerificationResult = {
      mxVerified: false,
      spfVerified: false,
      dkimVerified: false,
      dmarcVerified: false,
      allVerified: false,
    };

    try {
      // Verificar MX
      const mxResult = await this.verifyMX(domainName);
      result.mxVerified = mxResult.verified;
      result.mxRecord = mxResult.record;

      // Verificar SPF
      const spfResult = await this.verifySPF(domainName);
      result.spfVerified = spfResult.verified;
      result.spfRecord = spfResult.record;

      // Verificar DKIM (requiere selector, por defecto "default")
      const dkimResult = await this.verifyDKIM(domainName, "default");
      result.dkimVerified = dkimResult.verified;
      result.dkimRecord = dkimResult.record;

      // Verificar DMARC
      const dmarcResult = await this.verifyDMARC(domainName);
      result.dmarcVerified = dmarcResult.verified;
      result.dmarcRecord = dmarcResult.record;

      // Todos verificados si al menos MX y SPF están
      result.allVerified = result.mxVerified && result.spfVerified;

      return result;
    } catch (error) {
      console.error("Error verificando DNS:", error);
      return result;
    }
  }

  /**
   * Verifica registro MX
   */
  static async verifyMX(domainName: string): Promise<{ verified: boolean; record?: string }> {
    try {
      const mxRecords = await dns.resolveMx(domainName);
      if (mxRecords && mxRecords.length > 0) {
        // Ordenar por prioridad
        mxRecords.sort((a, b) => a.priority - b.priority);
        return {
          verified: true,
          record: `${mxRecords[0].priority} ${mxRecords[0].exchange}`,
        };
      }
      return { verified: false };
    } catch (error) {
      return { verified: false };
    }
  }

  /**
   * Verifica registro SPF en TXT
   */
  static async verifySPF(domainName: string): Promise<{ verified: boolean; record?: string }> {
    try {
      const txtRecords = await dns.resolveTxt(domainName);
      const spfRecord = txtRecords
        .flat()
        .find((record) => record.startsWith("v=spf1"));

      if (spfRecord) {
        return {
          verified: true,
          record: spfRecord,
        };
      }
      return { verified: false };
    } catch (error) {
      return { verified: false };
    }
  }

  /**
   * Verifica registro DKIM
   */
  static async verifyDKIM(
    domainName: string,
    selector: string = "default"
  ): Promise<{ verified: boolean; record?: string }> {
    try {
      const dkimDomain = `${selector}._domainkey.${domainName}`;
      const txtRecords = await dns.resolveTxt(dkimDomain);
      const dkimRecord = txtRecords.flat().find((record) => record.includes("v=DKIM1"));

      if (dkimRecord) {
        return {
          verified: true,
          record: dkimRecord,
        };
      }
      return { verified: false };
    } catch (error) {
      return { verified: false };
    }
  }

  /**
   * Verifica registro DMARC
   */
  static async verifyDMARC(domainName: string): Promise<{ verified: boolean; record?: string }> {
    try {
      const dmarcDomain = `_dmarc.${domainName}`;
      const txtRecords = await dns.resolveTxt(dmarcDomain);
      const dmarcRecord = txtRecords.flat().find((record) => record.startsWith("v=DMARC1"));

      if (dmarcRecord) {
        return {
          verified: true,
          record: dmarcRecord,
        };
      }
      return { verified: false };
    } catch (error) {
      return { verified: false };
    }
  }

  /**
   * Obtiene instrucciones DNS para un dominio
   */
  static getDnsInstructions(domainName: string): {
    mx: string[];
    spf: string[];
    dkim: string[];
    dmarc: string[];
  } {
    return {
      mx: [
        `Registro MX:`,
        `  Nombre: ${domainName}`,
        `  Tipo: MX`,
        `  Prioridad: 10`,
        `  Valor: mail.${domainName}`,
        ``,
        `Nota: Reemplaza "mail.${domainName}" con la IP o hostname de tu servidor de correo`,
      ],
      spf: [
        `Registro SPF:`,
        `  Nombre: ${domainName}`,
        `  Tipo: TXT`,
        `  Valor: v=spf1 mx ~all`,
        ``,
        `Nota: Esto permite que cualquier servidor MX envíe correos desde este dominio`,
      ],
      dkim: [
        `Registro DKIM:`,
        `  Nombre: default._domainkey.${domainName}`,
        `  Tipo: TXT`,
        `  Valor: (generar clave DKIM)`,
        ``,
        `Nota: Necesitas generar una clave DKIM. Puedes usar herramientas online o openssl`,
      ],
      dmarc: [
        `Registro DMARC:`,
        `  Nombre: _dmarc.${domainName}`,
        `  Tipo: TXT`,
        `  Valor: v=DMARC1; p=none; rua=mailto:admin@${domainName}`,
        ``,
        `Nota: Cambia "admin@${domainName}" por tu email de administración`,
      ],
    };
  }
}

export default DnsVerificationService;

