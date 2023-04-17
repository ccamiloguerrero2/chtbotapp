
const { createBot, createProvider, createFlow, addKeyword, addAnswer } = require('@bot-whatsapp/bot')
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')
const axios = require('axios');

///////////////////////// API PLANES /////////////////////////

const menuIDPLANES = async () => {
  const config = {
    method: 'get',
    url: `https://www.cloud.wispro.co/api/v1/plans`,
    headers: {
      'Authorization': 'de5e1560-13dc-41b0-8c9a-9378aaa80f11', 
      'accept': 'application/json'
    }
  };

  try {
    const { data } = await axios(config);
    return data.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

///////////////////////// API CONTRATOS ///////////////////////



const menuAPICONTRATO = async (numero_documento) => {
  const parsedNumeroDocumento = parseFloat(numero_documento.replace(/[\.,]/g, ''));
  const planes = await menuIDPLANES();
  const config = {
    method: 'get',
    url: `https://www.cloud.wispro.co/api/v1/contracts?client_national_identification_number_eq=${parsedNumeroDocumento}`,
    headers: {
      'Authorization': 'de5e1560-13dc-41b0-8c9a-9378aaa80f11',
      'accept': 'application/json'
    }
  };
  try {
    const { data } = await axios(config);
    let contracts = Array.from(data.data);
    if (contracts.length === 0) {
      const formattedNumeroDocumentoConPuntos = parsedNumeroDocumento.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      const configConPuntos = { ...config, url: `https://www.cloud.wispro.co/api/v1/contracts?client_national_identification_number_eq=${formattedNumeroDocumentoConPuntos}` };
      const { data: dataConPuntos } = await axios(configConPuntos);
      if (!dataConPuntos || !Array.isArray(dataConPuntos.data) || dataConPuntos.data.length === 0) {
        return [{ body: '*Contrato:* No se encontró ningún contrato.' }];
      }
      contracts = Array.isArray(dataConPuntos.data) ? dataConPuntos.data : [dataConPuntos.data];
    }
    if (!contracts || contracts.length < 1) {
      return [{ body: '*Contrato:* No se encontró ningún contrato.' }];
    }
    console.log(`Number of contracts found: ${Array.isArray(contracts) ? contracts.length : 1}`);
    totalContratos = Array.isArray(contracts) ? contracts.length : 1;    
    console.log(`Total de contratos: ${totalContratos}`);
    
    let contractInfo = [], planName;
    if (totalContratos === 1) {
      const contract = contracts[0];
      const { state, start_date, plan_id } = contract;
      const stateText = state === "enabled" ? "ACTIVADO ✅" : state === "disabled" ? "DESACTIVADO ❌" : state;
      // Buscar el nombre del plan
      const plan = planes.find((p) => p.id === plan_id);
      planName = plan ? plan.name : 'Desconocido';
      contractInfo = `${totalContratos}. Su contrato se encuentra: *${stateText}*\nContrato creado en: ${start_date}\nPlan: ${planName}`;
    } else {
      contractInfo = contracts.map((contract, index) => {
        const { state, start_date, plan_id } = contract;
        const stateText = state === "enabled" ? "ACTIVADO ✅" : state === "disabled" ? "DESACTIVADO ❌" : state;
        const plan = planes.find((p) => p.id === plan_id);
        planName = plan ? plan.name : 'Desconocido';
        return `Contrato No. ${index+1}: Su contrato se encuentra: *${stateText}*\nContrato creado en: ${start_date}\nPlan del contrato: ${planName}\n`;
      });
    }
    return [{ body: contractInfo.join("\n"), total_contratos: totalContratos }];
  } catch (error) {
    return [{ body: 'Ocurrió un error al realizar la búsqueda. Por favor, inténtalo de nuevo más tarde.' }];
  }
};


///////////////////////// API USUARIOS ///////////////////////


const menuAPI = async (numero_documento) => {
  const formatted_numero_documento = numero_documento.replace(/\./g, '');
  const parsed_numero_documento = parseFloat(formatted_numero_documento.replace(/,/g, '.'));
  const config = {
    method: 'get',
    url: `https://www.cloud.wispro.co/api/v1/clients?national_identification_number_eq=${parsed_numero_documento}`,
    headers: {
      'Authorization': 'de5e1560-13dc-41b0-8c9a-9378aaa80f11', 
      'accept': 'application/json'
    }
  };

  try {
    const { data } = await axios(config);
    const client = data.data[0];

    if (!client) {
      const formatted_numero_documento_con_puntos = parsed_numero_documento.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      const config_con_puntos = {
        method: 'get',
        url: `https://www.cloud.wispro.co/api/v1/clients?national_identification_number_eq=${formatted_numero_documento_con_puntos}`,
        headers: {
          'Authorization': 'de5e1560-13dc-41b0-8c9a-9378aaa80f11',
          'accept': 'application/json'
        }
      };
      const { data: data_con_puntos } = await axios(config_con_puntos);

      if (data_con_puntos.data.length === 0) {
        return [{ body: '*Cliente:* No se encontró ningún cliente con el número de identificación proporcionado.' }];
      }

      const {
        name,
        address,
        id,
        public_id,
        custom_id,
        email,
        password,
        phone,
        phone_mobile,
        phone_mobile_verified,
        national_identification_number,
        city,
        state,
        details,
        collector_id,
        seller_id,
        neighborhood_id,
        created_at,
        updated_at,
        link_mobile_login
      } = data_con_puntos.data[0];

      return [
        { body: `Usuario: *${name}:*\nDirección: ${address}\nEmail: ${email}\nNo. de documento: ${national_identification_number}\nCiudad: ${city}\nEstado: ${state}`
      },
      ];
    }

    const {
      name,
      address,
      id,
      custom_id,
      email,
      password,
      phone,
      phone_mobile,
      phone_mobile_verified,
      national_identification_number,
      city,
      state,
      details,
      collector_id,
      seller_id,
      neighborhood_id,
      created_at,
      updated_at,
      link_mobile_login
    } = client;

    return [
      { body: `Usuario: *${name}:*\nDirección: ${address}\nID: ${id}\nEmail: ${email}\nNo. de documento: ${national_identification_number}\nCiudad: ${city}\nEstado: ${state}\nCreado en: ${created_at}\nActualziado en: ${updated_at}`
    }];
  } catch (error) {  }
};





///////////////////////// FLUJO CONVERSACIÓN //////////////////////


const flowUsuarioNuevo = 
addKeyword(['0'])
.addAnswer(['Para contratar nuestro servicio de internet previamente se hará estudio crediticio en centrales de riesgos (no tiene costo y sin compromiso alguno)\n',
'🧾 REQUISITOS PARA EL ESTUDIO CREDITICIO:\n',
'Estos documentos puede enviarlos con foto tomada desde el celular siempre y cuando se vea enfocada la imagen y sean legibles los textos\n',

'1️⃣ Foto de cédula ambas caras ( o cualquier documento extranjero )\n',


'2️⃣ Recibo de servicios Públicos ( únicamente para validación de dirección y estrato del predio \n',


'3️⃣ Aceptar y firmar el documento de Autorización de tratamiento de datos personales, ( Para permitirnos realizar el estudio crediticio) (Adjunto documento PDF al final del chat)\n',

'👉🏼 COSTOS DE INSTALACIÓN:\n',

'-Material Instalado $ 90.000 (Se deben cancelar el día de la instalación)',

'-Router TP-Link dos antenas* $ 90.000 (Se debe cancelar el día de la instalación)*\n',

'=TOTAL A CANCELAR $ 180.000',

'*Este router quedará de su propiedad, pero si usted ya tiene un router por favor enviar referencia del modelo para ver si es compatible y no se le cobrará.\n',

'🏷La primer factura del plan del servicio que contrate la puede cancelar a más tardar el día 30 del mes de la instalación.\n',

'Por favor tenga en cuenta que nuestro servicio cuenta con contrato por un año, (ya que nosotros cubrimos el costo del cambio de la antena en caso de que esta se llegue a dañar.'])
.addAnswer(['Planes y Tarifas'], { media: 'https://live.staticflickr.com/65535/52766118292_b4a97a4968_k.jpg' })
.addAnswer(['Autorización Tratamineto de datos'], { media: 'https://drive.google.com/uc?export=view&id=1szf0mj3Y3wmQ0qLudxGBqG2Rd4iKWBP5&rl' })





const flowSoportetecnico = 
addKeyword(['2'])
.addAnswer([
  '🟢 *0*. No tengo Internet en ningúno de mis disposiivos.',
  '🟢 *1*. No tengo Internet en solo uno de mis dispositivos.',
  '🟢 *2*. Mi internet está lento o intermitente'])


  const flowConsultadecontrato = 
  addKeyword(['0'])
    .addAnswer('Digita el número de documento del Titular de la cuenta:', { capture: true }, (ctx) => {
    console.log('No de Documento consultado: ', ctx.body);
    ctx.flow = ctx.flow || {}; // Verifica que ctx.flow exista
    ctx.flow.numero_documento = ctx.body; return ctx.body;
    })
    .addAnswer('Verificando ✅',null, async (ctx, { flowDynamic }) => {
    const numero_documento = ctx.flow?.numero_documento;
    console.log('Número de documento capturado: ', numero_documento);
     if (numero_documento) {
       const data = await Promise.all([menuAPICONTRATO(numero_documento), menuAPI(numero_documento)]);
       const message1 = data[0][0].body;
       const message = data[1][0].body;
      const totalContratos = data[0][0].total_contratos;
      const totalContratosMessage = `Total de contratos encontrados:`;
  flowDynamic([{ body: `\n${totalContratosMessage} ${totalContratos}\n\n${message1}\n${message}\n`, total_contratos: totalContratos }])

     } else{
       console.log('No se capturó un número de documento válido.');
     }
  })


  const flowUsuarioantiguo = 
  addKeyword(['1'])
  .addAnswer([
  '🟢 *0*. Consultar el estado de mi contrato de internet.',
  '🟢 *1*. Solicitar un traspaso de titular de la cuenta',
  '🟢 *2*. Solicitar un cambio de plan de internet'],
  null, null, [flowConsultadecontrato])



const flowINICIO = addKeyword(['.consulta1!']).addAnswer(['*📡 ¡Hola! Te damos la bienvenida a Radionet Soluciones* 👋\n\nPara darte una atención mas personalizada, elige una de las siguientes opciones, Solo debes escribir el número de la opción que deseas consultar :\n',
'🟢 *0*. Deseo consultar información de los planes de internet, costos, requisitos y zonas de cobertura.',
'🟢 *1*. Ya soy cliente y deseo hacer una solicitud o realizar un trámite administrativo.',
'🟢 *2*. Ya soy cliente y necesito soporte técnico para mi servicio de internet.'],
null,null, [flowUsuarioNuevo, flowUsuarioantiguo, flowSoportetecnico, flowConsultadecontrato])
 



const main = async () => {
  const adapterDB = new MockAdapter()
  const adapterFlow = createFlow([flowINICIO])
  const adapterProvider = createProvider(BaileysProvider)

  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  })

  QRPortalWeb()
}


main();