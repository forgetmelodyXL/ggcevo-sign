import { Context, Schema } from 'koishi'
import 'koishi-plugin-sc2arcade-search'

export const name = 'ggcevo-sign'

export const inject = {
  required: ['database'],
}

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

export const ItemConfig: Record<number, string> = {
  1: '金币',
  2: '咕咕币',
  3: '兑换券',
  4: '扭蛋币',
  5: 't3级宠物扭蛋',
  6: 't2级宠物扭蛋',
  7: 't1级宠物扭蛋',
  8: 't0级宠物扭蛋',
  9: '补签券',
}

export const LotteryPoolConfig: Record<number, string> = {
  1: '金币池',
  2: '普通池',
  3: '皮肤池',
  4: '宠物池',
}

export type ItemQuality = 't0' | 't1' | 't2' | 't3' | '限定'
export type ItemType = '皮肤' | '入场特效' | '物品' | '宠物'

export interface ExchangeItem {
  name: string
  quality: ItemQuality
  type: ItemType
}

export const ExchangeConfig: Record<number, ExchangeItem> = {
  1: { name: '拾荒者', quality: 't3', type: '皮肤' },
  2: { name: '劳工', quality: 't3', type: '皮肤' },
  3: { name: '老兵', quality: 't2', type: '皮肤' },
  4: { name: '合成人', quality: 't2', type: '皮肤' },
  5: { name: '阿斯塔特', quality: 't1', type: '皮肤' },
  6: { name: '皇家指挥官', quality: 't1', type: '皮肤' },
  7: { name: '个性开场白', quality: 't1', type: '入场特效' },
  8: { name: '史蒂夫', quality: '限定', type: '皮肤' },
  9: { name: 'ep4', quality: 't0', type: '物品' },
  10: { name: '小狗', quality: 't3', type: '宠物' },
  11: { name: '小猫', quality: 't3', type: '宠物' },
  12: { name: '小黄鸭', quality: 't3', type: '宠物' },
  13: { name: '萌萌熊', quality: 't2', type: '宠物' },
  14: { name: '荆棘蜥蜴', quality: 't2', type: '宠物' },
  15: { name: '萌宠小狗', quality: 't1', type: '宠物' },
  16: { name: '熔岩虫', quality: 't1', type: '宠物' },
  17: { name: '尸甲虫', quality: 't1', type: '宠物' },
  18: { name: '绿毛虫', quality: 't0', type: '宠物' },
  19: { name: '妙蛙种子', quality: 't0', type: '宠物' },
  20: { name: '皮卡丘', quality: 't0', type: '宠物' },
  21: { name: '哆啦A梦', quality: 't0', type: '宠物' },
}

declare module 'koishi' {
  interface Tables {
    ggcevo_backpack: Backpack
    ggcevo_signin_summary: SigninSummary
    ggcevo_signin_log: SigninLog
    ggcevo_lottery_log: LotteryLog
    ggcevo_lottery_status: LotteryStatus
    ggcevo_exchange_log: ExchangeLog
  }
}

export interface Backpack {
  id: number
  user_id: string
  item_id: number
  count: number
}

export interface SigninSummary {
  user_id: string // 用户ID（主键）
  total_days: number // 历史累计签到天数
  month_days: number // 本月签到天数
  current_month: number // 记录当前数据的月份（用于跨月重置）
  continuous_days: number //当前连续签到天数（断签则归1或归0）
  last_signin_date: Date //最后一次签到日期（用来判断是否断签）
  update_time: Date //更新时间
}

export interface SigninLog {
  id: number // 主键ID
  user_id: string //用户ID
  signin_date: Date //签到日期（如：2026-05-05）
  signin_type: number // 类型：0=正常签到 1=补签
  reward_config: string // 领取的配置标识（如：day_7）
  create_time: Date // 创建时间
}

export interface LotteryLog {
  id: number // 主键ID
  user_id: string //用户ID
  lottery_id: number //奖池ID
  prize_id: number // 中奖物品ID（对应物品模板）
  cost_type: number // 消耗类型（0=免费 1=金币 2=咕咕币）
  cost_num: number // 消耗数量
  draw_time: Date // 抽奖时间
}

export interface LotteryStatus {
  user_id: string // 主键ID
  lottery_id: number //奖池ID（区分：普通池、活动池、新手池）
  pity_counter: number // 保底计数器（抽多少次没出SSR了）
  total_draw_count: number // 累计抽奖次数
  pity_triggered_count: number // 保底触发次数（抽多少次触发了保底）
  rare_hit_count: number // 稀有物品抽中次数（抽多少次中了稀有物品）
  update_time: Date // 更新时间
}

export interface ExchangeLog {
  id: number // 主键ID
  user_id: string //用户ID
  exchange_id: number //兑换物品ID（对应兑换物品模板）
  cost_type: number // 消耗类型（0=免费 1=兑换 2=抽奖）
  cost_amount: number // 消耗数量
  create_time: Date // 创建时间
}

export function apply(ctx: Context, config: Config) {
  const getHandle = async (session: any): Promise<string | null> => {
    const [profile] = await ctx.database.get('sc2arcade_player', { userId: session.userId, isActive: true });
    if (!profile) {
      return null;
    }
    const { regionId, realmId, profileId } = profile;
    return `${regionId}-S2-${realmId}-${profileId}`;
  };

  ctx.model.extend('ggcevo_backpack', {
    id: 'unsigned',
    user_id: 'string',
    item_id: 'unsigned',
    count: 'unsigned',
  }, {
    primary: 'id',
    autoInc: true
  })

  ctx.model.extend('ggcevo_signin_summary', {
    user_id: 'string', // 用户ID（主键）
    total_days: 'unsigned', // 历史累计签到天数
    month_days: 'unsigned', // 本月签到天数
    current_month: 'unsigned', // 记录当前数据的月份（用于跨月重置）
    continuous_days: 'unsigned', //当前连续签到天数（断签则归1或归0）
    last_signin_date: 'timestamp', //最后一次签到日期（用来判断是否断签）
    update_time: 'timestamp', //更新时间
  }, {
    primary: 'user_id',
  })

  ctx.model.extend('ggcevo_signin_log', {
    id: 'unsigned',
    user_id: 'string',
    signin_date: 'timestamp',
    signin_type: 'unsigned',
    reward_config: 'string',
    create_time: 'timestamp',
  }, {
    primary: 'id',
    autoInc: true
  })

  ctx.model.extend('ggcevo_lottery_log', {
    id: 'unsigned',
    user_id: 'string',
    lottery_id: 'unsigned',
    prize_id: 'unsigned',
    cost_type: 'unsigned',
    cost_num: 'unsigned',
    draw_time: 'timestamp',
  }, {
    primary: 'id',
    autoInc: true
  })

  ctx.model.extend('ggcevo_lottery_status', {
    user_id: 'string',
    lottery_id: 'unsigned',
    pity_counter: 'unsigned',
    total_draw_count: 'unsigned',
    pity_triggered_count: 'unsigned',
    rare_hit_count: 'unsigned',
    update_time: 'timestamp',
  }, {
    primary: 'user_id',
  })

  ctx.model.extend('ggcevo_exchange_log', {
    id: 'unsigned',
    user_id: 'string',
    exchange_id: 'unsigned',
    cost_type: 'unsigned',
    cost_amount: 'unsigned',
    create_time: 'timestamp',
  }, {
    primary: 'id',
    autoInc: true
  })

  ctx.command('ggcevo/签到')
    .action(async (argv) => {
      const session = argv.session;
      const handle = await getHandle(session);
      if (!handle) {
        return '🔒 需要先绑定游戏句柄。';
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [existingLog] = await ctx.database.get('ggcevo_signin_log', {
        user_id: handle,
        signin_date: { $gte: today },
      });

      if (existingLog) {
        return '📅 今日已签到，明天再来吧！';
      }

      const goldReward = Math.floor(Math.random() * 11) + 10;
      let gugubReward = 3;
      let extraGugubReward = 0;

      const [summary] = await ctx.database.get('ggcevo_signin_summary', { user_id: handle });

      const currentMonth = now.getFullYear() * 100 + (now.getMonth() + 1);
      let newTotalDays = 1;
      let newMonthDays = 1;
      let newContinuousDays = 1;

      if (summary) {
        newTotalDays = summary.total_days + 1;

        if (summary.current_month === currentMonth) {
          newMonthDays = summary.month_days + 1;
        } else {
          newMonthDays = 1;
        }

        const lastSignin = new Date(summary.last_signin_date);
        const lastSigninDate = new Date(lastSignin.getFullYear(), lastSignin.getMonth(), lastSignin.getDate());
        const dayDiff = Math.floor((today.getTime() - lastSigninDate.getTime()) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
          newContinuousDays = summary.continuous_days + 1;
        } else {
          newContinuousDays = 1;
        }
      }

      const monthRewardConfig: Record<number, number> = {
        7: 1,
        14: 2,
        21: 3,
        28: 4,
      };

      if (monthRewardConfig[newMonthDays]) {
        extraGugubReward = monthRewardConfig[newMonthDays];
        gugubReward += extraGugubReward;
      }

      await ctx.database.upsert('ggcevo_signin_summary', [{
        user_id: handle,
        total_days: newTotalDays,
        month_days: newMonthDays,
        current_month: currentMonth,
        continuous_days: newContinuousDays,
        last_signin_date: now,
        update_time: now,
      }]);

      await ctx.database.create('ggcevo_signin_log', {
        user_id: handle,
        signin_date: now,
        signin_type: 0,
        reward_config: 'daily',
        create_time: now,
      });

      const updateBackpackItem = async (itemId: number, count: number) => {
        const [existing] = await ctx.database.get('ggcevo_backpack', { user_id: handle, item_id: itemId });
        const newCount = existing ? existing.count + count : count;
        await ctx.database.upsert('ggcevo_backpack', [{
          user_id: handle, item_id: itemId, count: newCount
        }]);
      };

      await updateBackpackItem(1, goldReward);
      await updateBackpackItem(2, gugubReward);

      let message = `🎁 签到成功！\n获得 ${goldReward} 金币\n获得 ${gugubReward} 咕咕币\n累计签到 ${newTotalDays} 天\n连续签到 ${newContinuousDays} 天`;
      if (extraGugubReward > 0) {
        message += `\n⭐ 本月第${newMonthDays}次签到额外奖励：${extraGugubReward} 咕咕币`;
      }
      return message;
    });

  ctx.command('ggcevo/兑换 <id:number>')
    .action(async (argv, id) => {
      const session = argv.session;

      const handle = await getHandle(session);
      if (!handle) {
        return '🔒 需要先绑定游戏句柄。';
      }

      const exchangeItem = ExchangeConfig[id];
      if (!exchangeItem) {
        return `❌ 不存在ID为 ${id} 的兑换物品！`;
      }

      if (exchangeItem.quality === '限定') {
        return `❌ ${exchangeItem.name} 为限定物品，不可兑换！`;
      }

      const costMap: Record<string, number> = {
        't3': 3,
        't2': 4,
        't1': 5,
        't0': 6,
      };
      const costCount = costMap[exchangeItem.quality];

      const [couponItem] = await ctx.database.get('ggcevo_backpack', { user_id: handle, item_id: 3 });
      const couponCount = couponItem?.count || 0;

      if (couponCount < costCount) {
        return `❌ 兑换券不足！需要 ${costCount} 张兑换券，当前拥有 ${couponCount} 张。`;
      }

      const newCouponCount = couponCount - costCount;
      await ctx.database.upsert('ggcevo_backpack', [{
        user_id: handle, item_id: 3, count: newCouponCount
      }]);

      const now = new Date();
      await ctx.database.create('ggcevo_exchange_log', {
        user_id: handle,
        exchange_id: id,
        cost_type: 1,
        cost_amount: costCount,
        create_time: now,
      });

      return `🎁 兑换成功！\n消耗 ${costCount} 张兑换券\n获得 ${exchangeItem.name}（${exchangeItem.quality} - ${exchangeItem.type}）`;
    });

  ctx.command('ggcevo/抽奖')
    .option('poolId', '-p <poolId:number> 抽奖池ID')
    .option('count', '-c <count:number> 抽奖次数')
    .action(async (argv) => {
      const session = argv.session;
      const { poolId = 2, count } = argv.options;

      const handle = await getHandle(session);
      if (!handle) {
        return '🔒 需要先绑定游戏句柄。';
      }

      const poolName = LotteryPoolConfig[poolId] || '未知池';

      if (!LotteryPoolConfig[poolId]) {
        return `❌ 不存在ID为 ${poolId} 的奖池！`;
      }

      const isGoldPool = poolId === 1;
      const isSkinPool = poolId === 3;
      const isPetPool = poolId === 4;
      let costItemId: number;
      let costPerDraw: number;

      if (isGoldPool) {
        costItemId = 1;
        costPerDraw = 100;
      } else if (isSkinPool || isPetPool) {
        costItemId = 3;
        costPerDraw = 3;
      } else {
        costItemId = 2;
        costPerDraw = 1;
      }

      const [costItem] = await ctx.database.get('ggcevo_backpack', { user_id: handle, item_id: costItemId });
      const costItemCount = costItem?.count || 0;

      let drawCount: number;
      const maxDrawCount = Math.floor(costItemCount / costPerDraw);

      if (count !== undefined) {
        if (count <= 0) {
          return '❌ 抽奖次数必须大于0！';
        }
        if (count > maxDrawCount) {
          let costItemName: string;
          if (isGoldPool) {
            costItemName = '金币';
          } else if (isSkinPool || isPetPool) {
            costItemName = '兑换券';
          } else {
            costItemName = '咕咕币';
          }
          return `❌ ${costItemName}不足，当前拥有 ${costItemCount} ${costItemName}，需要 ${count * costPerDraw} ${costItemName}！`;
        }
        drawCount = count;
      } else {
        if (maxDrawCount <= 0) {
          let costItemName: string;
          if (isGoldPool) {
            costItemName = '金币';
          } else if (isSkinPool || isPetPool) {
            costItemName = '兑换券';
          } else {
            costItemName = '咕咕币';
          }
          return `❌ ${costItemName}不足，请先获取${costItemName}！`;
        }
        const isNormalPool = !isGoldPool && !isSkinPool && !isPetPool;
        drawCount = isNormalPool ? maxDrawCount : 1;
      }

      const now = new Date();

      const [lotteryStatus] = await ctx.database.get('ggcevo_lottery_status', { user_id: handle, lottery_id: poolId });
      let pityCounter = lotteryStatus?.pity_counter || 0;
      let rareHitCount = lotteryStatus?.rare_hit_count || 0;
      let pityTriggered = false;

      const rewards: { itemId: number; count: number }[] = [];
      let totalGold = 0;
      let totalCoupon = 0;
      let totalMakeupCoupon = 0;
      let nothingCount = 0;

      for (let i = 0; i < drawCount; i++) {
        const isNormalPool = !isGoldPool && !isSkinPool;
        if (isNormalPool) {
          pityCounter++;
        }

        let gotSSR = false;

        if (isGoldPool) {
          const rand = Math.random() * 100;

          if (rand < 25) {
            nothingCount++;
          } else if (rand < 75) {
            rewards.push({ itemId: 1, count: 80 });
            totalGold += 80;
          } else if (rand < 90) {
            rewards.push({ itemId: 1, count: 150 });
            totalGold += 150;
          } else if (rand < 95) {
            rewards.push({ itemId: 1, count: 200 });
            totalGold += 200;
          } else {
            rewards.push({ itemId: 9, count: 1 });
            totalMakeupCoupon += 1;
            gotSSR = true;
            rareHitCount++;
          }
        } else if (isSkinPool) {
          const skinItems = Object.entries(ExchangeConfig).filter(([_, item]) => item.type === '皮肤' && item.quality !== '限定');
          const t3Skins = skinItems.filter(([_, item]) => item.quality === 't3').map(([id]) => parseInt(id));
          const t2Skins = skinItems.filter(([_, item]) => item.quality === 't2').map(([id]) => parseInt(id));
          const t1Skins = skinItems.filter(([_, item]) => item.quality === 't1').map(([id]) => parseInt(id));

          const rand = Math.random() * 100;

          let prizeId: number;
          if (rand < 70) {
            prizeId = t3Skins[Math.floor(Math.random() * t3Skins.length)];
          } else if (rand < 90) {
            prizeId = t2Skins[Math.floor(Math.random() * t2Skins.length)];
          } else {
            prizeId = t1Skins[Math.floor(Math.random() * t1Skins.length)];
            gotSSR = true;
            rareHitCount++;
          }
          rewards.push({ itemId: prizeId, count: 1 });
        } else if (isPetPool) {
          const petItems = Object.entries(ExchangeConfig).filter(([_, item]) => item.type === '宠物');
          const t3Pets = petItems.filter(([_, item]) => item.quality === 't3').map(([id]) => parseInt(id));
          const t2Pets = petItems.filter(([_, item]) => item.quality === 't2').map(([id]) => parseInt(id));
          const t1Pets = petItems.filter(([_, item]) => item.quality === 't1').map(([id]) => parseInt(id));
          const t0Pets = petItems.filter(([_, item]) => item.quality === 't0').map(([id]) => parseInt(id));

          const rand = Math.random() * 100;

          let prizeId: number;
          if (rand < 65) {
            prizeId = t3Pets[Math.floor(Math.random() * t3Pets.length)];
          } else if (rand < 85) {
            prizeId = t2Pets[Math.floor(Math.random() * t2Pets.length)];
          } else if (rand < 95) {
            prizeId = t1Pets[Math.floor(Math.random() * t1Pets.length)];
          } else {
            prizeId = t0Pets[Math.floor(Math.random() * t0Pets.length)];
            gotSSR = true;
            rareHitCount++;
          }
          rewards.push({ itemId: prizeId, count: 1 });
        } else {
          if (pityCounter >= 90) {
            rewards.push({ itemId: 3, count: 1 });
            totalCoupon += 1;
            gotSSR = true;
            pityCounter = 0;
            rareHitCount++;
            pityTriggered = true;
          } else {
            const rand = Math.random() * 100;

            if (rand < 70) {
              rewards.push({ itemId: 1, count: 5 });
              totalGold += 5;
            } else if (rand < 80) {
              rewards.push({ itemId: 1, count: 10 });
              totalGold += 10;
            } else if (rand < 85) {
              rewards.push({ itemId: 1, count: 20 });
              totalGold += 20;
            } else if (rand < 89.5) {
              rewards.push({ itemId: 1, count: 100 });
              totalGold += 100;
            } else if (rand < 90) {
              rewards.push({ itemId: 3, count: 1 });
              totalCoupon += 1;
              gotSSR = true;
              pityCounter = 0;
              rareHitCount++;
            } else {
              nothingCount++;
            }
          }
        }
      }

      const newCostCount = costItemCount - drawCount * costPerDraw;
      await ctx.database.upsert('ggcevo_backpack', [{
        user_id: handle, item_id: costItemId, count: newCostCount
      }]);

      if (totalGold > 0) {
        const [goldItem] = await ctx.database.get('ggcevo_backpack', { user_id: handle, item_id: 1 });
        const newGoldCount = (goldItem?.count || 0) + totalGold;
        await ctx.database.upsert('ggcevo_backpack', [{
          user_id: handle, item_id: 1, count: newGoldCount
        }]);
      }

      if (totalCoupon > 0) {
        const [couponItem] = await ctx.database.get('ggcevo_backpack', { user_id: handle, item_id: 3 });
        const newCouponCount = (couponItem?.count || 0) + totalCoupon;
        await ctx.database.upsert('ggcevo_backpack', [{
          user_id: handle, item_id: 3, count: newCouponCount
        }]);
      }

      if (totalMakeupCoupon > 0) {
        const [makeupItem] = await ctx.database.get('ggcevo_backpack', { user_id: handle, item_id: 9 });
        const newMakeupCount = (makeupItem?.count || 0) + totalMakeupCoupon;
        await ctx.database.upsert('ggcevo_backpack', [{
          user_id: handle, item_id: 9, count: newMakeupCount
        }]);
      }

      if (isSkinPool || isPetPool) {
        for (const reward of rewards) {
          const [existingItem] = await ctx.database.get('ggcevo_backpack', { user_id: handle, item_id: reward.itemId });
          const newCount = (existingItem?.count || 0) + reward.count;
          await ctx.database.upsert('ggcevo_backpack', [{
            user_id: handle, item_id: reward.itemId, count: newCount
          }]);

          await ctx.database.create('ggcevo_exchange_log', {
            user_id: handle,
            exchange_id: reward.itemId,
            cost_type: 2,
            cost_amount: costPerDraw,
            create_time: now,
          });
        }
      }

      let costTypeName: number;
      if (isGoldPool) {
        costTypeName = 1;
      } else if (isSkinPool || isPetPool) {
        costTypeName = 1;
      } else {
        costTypeName = 2;
      }
      for (let i = 0; i < drawCount; i++) {
        const reward = rewards[i] || { itemId: 0, count: 0 };
        await ctx.database.create('ggcevo_lottery_log', {
          user_id: handle,
          lottery_id: poolId,
          prize_id: reward.itemId,
          cost_type: costTypeName,
          cost_num: costPerDraw,
          draw_time: now,
        });
      }

      const newTotalDrawCount = (lotteryStatus?.total_draw_count || 0) + drawCount;
      const newPityTriggeredCount = (lotteryStatus?.pity_triggered_count || 0) + (pityTriggered ? 1 : 0);
      await ctx.database.upsert('ggcevo_lottery_status', [{
        user_id: handle,
        lottery_id: poolId,
        pity_counter: pityCounter,
        total_draw_count: newTotalDrawCount,
        pity_triggered_count: newPityTriggeredCount,
        rare_hit_count: rareHitCount,
        update_time: now,
      }]);

      let costItemName: string;
      if (isGoldPool) {
        costItemName = '金币';
      } else if (isSkinPool || isPetPool) {
        costItemName = '兑换券';
      } else {
        costItemName = '咕咕币';
      }
      let result = `🎰 使用 ${drawCount * costPerDraw} ${costItemName}进行了 ${drawCount} 次${poolName}抽奖！\n`;

      if (isSkinPool) {
        const skinRewards: { name: string; quality: string }[] = [];
        for (const reward of rewards) {
          const item = ExchangeConfig[reward.itemId];
          if (item) {
            skinRewards.push({ name: item.name, quality: item.quality });
          }
        }
        for (const skin of skinRewards) {
          let qualityEmoji = '';
          switch (skin.quality) {
            case 't1': qualityEmoji = '⭐'; break;
            case 't2': qualityEmoji = '✨'; break;
            case 't3': qualityEmoji = '💫'; break;
          }
          result += `${qualityEmoji} 获得 ${skin.name}（${skin.quality}）\n`;
        }
      } else if (isPetPool) {
        const petRewards: { name: string; quality: string }[] = [];
        for (const reward of rewards) {
          const item = ExchangeConfig[reward.itemId];
          if (item) {
            petRewards.push({ name: item.name, quality: item.quality });
          }
        }
        for (const pet of petRewards) {
          let qualityEmoji = '';
          switch (pet.quality) {
            case 't0': qualityEmoji = '👑'; break;
            case 't1': qualityEmoji = '⭐'; break;
            case 't2': qualityEmoji = '✨'; break;
            case 't3': qualityEmoji = '💫'; break;
          }
          result += `${qualityEmoji} 获得 ${pet.name}（${pet.quality}）\n`;
        }
      } else {
        if (totalGold > 0) result += `💰 获得 ${totalGold} 金币\n`;
        if (totalCoupon > 0) result += `🎫 获得 ${totalCoupon} 兑换券\n`;
        if (totalMakeupCoupon > 0) result += `🎟️ 获得 ${totalMakeupCoupon} 补签券\n`;
        if (nothingCount > 0) result += `💨 ${nothingCount} 次未获得物品\n`;
      }
      result += `累计抽奖次数：${newTotalDrawCount}`;

      return result;
    });

}
