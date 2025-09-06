const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// مسار ملف النقاط
const pointsFilePath = path.join(__dirname, 'points.json');

// تحميل النقاط من الملف
function loadPoints() {
    try {
        if (fs.existsSync(pointsFilePath)) {
            const data = fs.readFileSync(pointsFilePath, 'utf8');
            return new Map(Object.entries(JSON.parse(data)));
        }
    } catch (error) {
        console.error('خطأ في تحميل ملف النقاط:', error);
    }
    return new Map();
}

// حفظ النقاط في الملف
function savePoints(userPoints) {
    try {
        const data = Object.fromEntries(userPoints);
        fs.writeFileSync(pointsFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('خطأ في حفظ ملف النقاط:', error);
    }
}

// بيانات العجلات والجوائز (مع تعديل النسب الجديدة)
const wheelData = {
    n: { // العجلة العادية
        name: 'العجلة العادية',
        price: 40000,
        requiredPoints: 1,
        command: 'c 819508960587284521 42000',
        prizes: [
            { name: '10k', weight: 50 }, // الجائزة الأقل - نسبة عالية جداً
            { name: '30k', weight: 25 }, // نسبة متوسطة
            { name: '50k', weight: 5 },  // الجوائز العالية - نسبة قليلة جداً
            { name: '60k', weight: 2 },  // الجوائز العالية - نسبة قليلة جداً جداً
            { name: 'Game Over', weight: 80 } // نسبة عالية جداً
        ]
    },
    s: { // العجلة السوبر
        name: 'العجلة السوبر',
        price: 80000,
        requiredPoints: 2,
        command: 'c 819508960587284521 82000',
        prizes: [
            { name: '40k', weight: 45 }, // الجائزة الأقل - نسبة عالية جداً
            { name: '90k', weight: 20 }, // نسبة متوسطة
            { name: '100k', weight: 3 }, // الجوائز العالية - نسبة قليلة جداً
            { name: '110k', weight: 1 }, // الجوائز العالية - نسبة قليلة جداً جداً
            { name: 'Game Over', weight: 75 } // نسبة عالية جداً
        ]
    },
    k: { // العجلة الخوارزمية
        name: 'العجلة الخوارزمية',
        price: 140000,
        requiredPoints: 4,
        command: 'c 819508960587284521 144000',
        prizes: [
            { name: '90k', weight: 40 }, // الجائزة الأقل - نسبة عالية جداً
            { name: '190k', weight: 8 }, // نسبة قليلة
            { name: '200k', weight: 3 }, // نسبة قليلة جداً
            { name: '1m', weight: 0.5 }, // نسبة نادرة جداً (أقل من 1%)
            { name: 'Game Over', weight: 85 } // نسبة عالية جداً - تمت إضافتها!
        ]
    }
};

// قاعدة بيانات النقاط
let userPoints = loadPoints();

client.on('ready', () => {
    console.log(`تم تسجيل الدخول باسم ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // أمر إرسال التذكرة
    if (message.content === '-send-ticket') {
        const targetChannel = client.channels.cache.get('1397586203859095713');
        if (!targetChannel) {
            return message.reply('❌ لم يتم العثور على الروم المحدد');
        }

        const embed = new EmbedBuilder()
            .setTitle('🎰 عجلة الحظ')
            .setColor('#FFD700')
            .addFields(
                { name: '🎯 العجلة العادية', value: 'السعر: 40k\nالنقاط المطلوبة: 1', inline: true },
                { name: '⭐ العجلة السوبر', value: 'السعر: 80k\nالنقاط المطلوبة: 2', inline: true },
                { name: '💎 العجلة الخوارزمية', value: 'السعر: 140k\nالنقاط المطلوبة: 4', inline: true }
            )
            .setDescription('اختر نوع العجلة التي تريد شراؤها!')
            .setFooter({ text: 'استخدم الأزرار أدناه للشراء' });

        const buyButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('buy_n')
                    .setLabel('شراء العجلة العادية')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎯'),
                new ButtonBuilder()
                    .setCustomId('buy_s')
                    .setLabel('شراء العجلة السوبر')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('⭐'),
                new ButtonBuilder()
                    .setCustomId('buy_k')
                    .setLabel('شراء العجلة الخوارزمية')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('💎')
            );

        const adminButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_private_room')
                    .setLabel('إنشاء روم خاص')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔒')
            );

        await targetChannel.send({ embeds: [embed], components: [buyButtons, adminButton] });
        message.reply('✅ تم إرسال البانل بنجاح!');
    }

    // أمر إضافة النقاط (للإدارة فقط)
    if (message.content.startsWith('-add-point')) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ هذا الأمر متاح للإدارة فقط');
        }

        const args = message.content.split(' ');
        if (args.length !== 3) {
            return message.reply('❌ الاستخدام الصحيح: `-add-point @user points`');
        }

        const user = message.mentions.users.first();
        const points = parseInt(args[2]);

        if (!user || isNaN(points)) {
            return message.reply('❌ يرجى ذكر المستخدم وكتابة عدد النقاط صحيح');
        }

        const currentPoints = userPoints.get(user.id) || 0;
        userPoints.set(user.id, currentPoints + points);
        
        // حفظ النقاط في الملف
        savePoints(userPoints);

        message.reply(`✅ تم إضافة ${points} نقطة إلى ${user.username}. إجمالي النقاط: ${currentPoints + points}`);
    }

    // أمر تدوير العجلة
    if (message.content.startsWith('-spin')) {
        const args = message.content.split(' ');
        if (args.length !== 2) {
            return message.reply('❌ الاستخدام الصحيح: `-spin n/s/k`');
        }

        const wheelType = args[1].toLowerCase();
        if (!wheelData[wheelType]) {
            return message.reply('❌ نوع العجلة غير صحيح. استخدم: n (عادية) أو s (سوبر) أو k (خوارزمية)');
        }

        const wheel = wheelData[wheelType];
        const userCurrentPoints = userPoints.get(message.author.id) || 0;

        if (userCurrentPoints < wheel.requiredPoints) {
            return message.reply(`❌ تحتاج إلى ${wheel.requiredPoints} نقطة لاستخدام ${wheel.name}. نقاطك الحالية: ${userCurrentPoints}`);
        }

        // خصم النقاط
        userPoints.set(message.author.id, userCurrentPoints - wheel.requiredPoints);
        
        // حفظ النقاط في الملف
        savePoints(userPoints);

        // اختيار الجائزة (مع تفضيل الجوائز الأقل)
        const prize = selectPrize(wheel.prizes);

        const resultEmbed = new EmbedBuilder()
            .setTitle(`🎰 نتيجة ${wheel.name}`)
            .setColor(prize.name === 'Game Over' ? '#FF0000' : '#00FF00')
            .addFields(
                { name: '🎯 الجائزة', value: prize.name, inline: true },
                { name: '📊 نقاطك المتبقية', value: (userPoints.get(message.author.id) || 0).toString(), inline: true }
            )
            .setDescription(`${message.author}, لقد حصلت على: **${prize.name}**`)
            .setThumbnail(message.author.displayAvatarURL())
            .setTimestamp();

        if (prize.name === 'Game Over') {
            resultEmbed.setDescription('💀 للأسف، حظك سيء اليوم! حاول مرة أخرى.');
        }

        message.reply({ embeds: [resultEmbed] });
    }
});

// معالج الأزرار
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('buy_')) {
        const wheelType = interaction.customId.split('_')[1];
        const wheel = wheelData[wheelType];

        const embed = new EmbedBuilder()
            .setTitle('💳 معلومات الشراء')
            .setColor('#FFD700')
            .setDescription(`لشراء ${wheel.name}، استخدم الأمر التالي:`)
            .addFields({ name: '💰 الأمر', value: `\`${wheel.command}\`` })
            .setFooter({ text: 'بعد الشراء، استخدم -spin ' + wheelType + ' للعب' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.customId === 'create_private_room') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ هذا الزر متاح للإدارة فقط', ephemeral: true });
        }

        try {
            const privateChannel = await interaction.guild.channels.create({
                name: `private-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    }
                ]
            });

            // إضافة الإدارة للروم
            const adminRole = interaction.guild.roles.cache.find(role => role.permissions.has(PermissionFlagsBits.Administrator));
            if (adminRole) {
                await privateChannel.permissionOverwrites.edit(adminRole.id, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true
                });
            }

            await interaction.reply({ content: `✅ تم إنشاء الروم الخاص: ${privateChannel}`, ephemeral: true });
        } catch (error) {
            await interaction.reply({ content: '❌ فشل في إنشاء الروم الخاص', ephemeral: true });
        }
    }
});

// دالة اختيار الجائزة مع تفضيل النتائج السيئة (محدثة لتكون أسوأ)
function selectPrize(prizes) {
    const totalWeight = prizes.reduce((sum, prize) => sum + prize.weight, 0);
    let random = Math.random() * totalWeight;
    
    // تقليل فرص الحصول على الجوائز الجيدة بشكل كبير جداً
    // كلما قل الرقم، كلما قل الحظ
    random = Math.pow(random / totalWeight, 0.15) * totalWeight;
    
    for (const prize of prizes) {
        random -= prize.weight;
        if (random <= 0) {
            return prize;
        }
    }
    
    // إذا لم نجد جائزة، نعيد Game Over أو أقل جائزة
    const gameOverPrize = prizes.find(p => p.name === 'Game Over');
    if (gameOverPrize) return gameOverPrize;
    
    // إرجاع الجائزة الأقل (10k, 40k, 90k حسب نوع العجلة)
    return prizes[0];
}

// تسجيل الدخول للبوت
client.login(process.env.token);

