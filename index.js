
const { Client, GatewayIntentBits } = require('discord.js');
const { evaluate } = require('mathjs');

// CONFIGURAZIONE
const TOKEN = process.env.DISCORD_TOKEN;
const COUNTING_CHANNEL = '1574882363723489440';

// CREA IL BOT
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// DATI DEL COUNTING
const channels = new Map();

function getData(channelId) {
    if (!channels.has(channelId)) {
        channels.set(channelId, {
            count: 0,
            lastUser: null,
            record: 0
        });
    }

    return channels.get(channelId);
}

// CALCOLO MATEMATICO
function calculateOperation(expression) {
    if (expression.length > 100) {
        throw new Error('Operazione troppo lunga');
    }

    // Accetta esclusivamente numeri e operatori matematici
    if (!/^[0-9+\-*/().%\s^]+$/.test(expression)) {
        throw new Error('Operazione non valida');
    }

    const result = evaluate(expression);

    if (
        typeof result !== 'number' ||
        !Number.isFinite(result) ||
        !Number.isInteger(result)
    ) {
        throw new Error('Risultato non valido');
    }

    return result;
}

// BOT ONLINE
client.once('ready', () => {
    console.log(`Counting Bot online: ${client.user.tag}`);
});

// EVENTO MESSAGGI
client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    if (message.channel.id !== COUNTING_CHANNEL) return;

    const data = getData(message.channel.id);

    let result;

    // PROVA A CALCOLARE IL MESSAGGIO
    try {
        result = calculateOperation(message.content);
    } catch {
        data.count = 0;
        data.lastUser = null;

        await message.react('❌');
        return;
    }

    // CONTROLLO UTENTE CONSECUTIVO
    if (message.author.id === data.lastUser) {
        data.count = 0;
        data.lastUser = null;

        await message.react('❌');
        return;
    }

    // CONTROLLO NUMERO CORRETTO
    if (result !== data.count + 1) {
        data.count = 0;
        data.lastUser = null;

        await message.react('❌');
        return;
    }

    // AGGIORNAMENTO COUNTING
    data.count = result;
    data.lastUser = message.author.id;

    // CONTROLLO RECORD
    if (result > data.record) {
        data.record = result;

        await message.react('☑️');
    } else {
        await message.react('✅');
    }

    console.log(`Counting: ${data.count} | Record: ${data.record}`);
});

// LOGIN
if (!TOKEN) {
    console.error('ERRORE: DISCORD_TOKEN non configurato!');
} else {
    client.login(TOKEN);
}
