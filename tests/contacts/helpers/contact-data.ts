import * as fs from "fs";
import * as path from "path";

const DATA_FILE = path.join(
  __dirname,
  "../../../playwright/.data/contact.json",
);

export interface ContactData {
  id: string;
  name: string;
  lastName: string;
  email?: string;
  phone?: string;
  createdAt: string;
}

/**
 * Guarda los datos del contacto creado en el test seed
 */
export function saveContactData(data: ContactData): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log(`[CONTACT-DATA] ✅ Contact data saved: ${data.id}`);
}

/**
 * Lee el UUID del contacto creado por el test seed
 */
export function getContactId(): string {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(
      `[CONTACT-DATA] ❌ Archivo de datos del contacto no encontrado. Ejecuta primero el seed: npm test tests/contacts/01-contacts-create.seed.spec.ts`,
    );
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as ContactData;

  if (!data.id) {
    throw new Error(
      `[CONTACT-DATA] ❌ ID de contacto no encontrado en el archivo de datos`,
    );
  }

  console.log(`[CONTACT-DATA] 📖 Using contact ID: ${data.id}`);
  return data.id;
}

/**
 * Lee todos los datos del contacto
 */
export function getContactData(): ContactData {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(
      `[CONTACT-DATA] ❌ Archivo de datos del contacto no encontrado. Ejecuta primero el seed.`,
    );
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as ContactData;
  console.log(
    `[CONTACT-DATA] 📖 Datos de contacto cargados: ${data.name} ${data.lastName}`,
  );
  return data;
}
