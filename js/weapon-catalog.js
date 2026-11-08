(function(root){
  'use strict';
  const groups=[{"id":"warrior","name":"战士","description":"近身作战，擅长破甲、控制与守护，也可专注暴击输出。"},{"id":"mage","name":"术士","description":"以智力施术，兼具群体伤害、削弱控制与辅助回复。"},{"id":"healer","name":"医师","description":"擅长单体和群体治疗，以护甲、抗性增益保护同伴。"},{"id":"assassin","name":"刺客","description":"凭技巧与速度出手，擅长暴击、流血、瘟疫和扰乱。"},{"id":"ranger","name":"游侠","description":"远程精准打击，兼具狙击与持续伤害，部分流派可急救。"},{"id":"berserker","name":"力士","description":"以武力重击破敌，擅长群体输出、吸血及灼烧。"}];
  const legacyTypes=[
  {
    "id": "blade",
    "name": "刀",
    "role": "单体重击",
    "group": "berserker",
    "ordinaryName": "朴刀",
    "skills": [
      {
        "id": "blade-cut",
        "name": "横刀斩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [],
        "scaling": {
          "war": 2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.08
      },
      {
        "id": "blade-burst",
        "name": "断岳斩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.8,
        "effects": [],
        "scaling": {
          "war": 5
        },
        "weaponCoefficient": 1,
        "hitChance": 0.3,
        "criticalChance": 0.15,
        "raceBonuses": {
          "humanoid": 0.1
        }
      },
      {
        "id": "blade-sweep",
        "name": "回旋斩",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 3,
        "effects": [],
        "scaling": {
          "war": 1.55
        },
        "weaponCoefficient": 1,
        "hitChance": 0.3,
        "criticalChance": 0.1
      }
    ],
    "daySkills": [
      {
        "id": "blade-cut-day",
        "name": "横刀斩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [],
        "scaling": {
          "war": 2.4
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.08
      },
      {
        "id": "blade-burst-day",
        "name": "断岳斩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.8,
        "effects": [],
        "scaling": {
          "war": 6
        },
        "weaponCoefficient": 1,
        "hitChance": 0.3,
        "criticalChance": 0.15,
        "raceBonuses": {
          "humanoid": 0.1
        }
      },
      {
        "id": "blade-sweep-day",
        "name": "回旋斩",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 3,
        "effects": [],
        "scaling": {
          "war": 1.8
        },
        "weaponCoefficient": 1,
        "hitChance": 0.3,
        "criticalChance": 0.1
      }
    ],
    "style": "重刃强攻"
  },
  {
    "id": "sword",
    "name": "剑",
    "role": "精准爆发",
    "group": "warrior",
    "ordinaryName": "长剑",
    "skills": [
      {
        "id": "sword-break",
        "name": "破甲剑",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 2,
        "effects": [
          {
            "id": "armorDown",
            "duration": 8,
            "chance": 0.4,
            "base": 3,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "armor",
            "negative": true
          }
        ],
        "scaling": {
          "war": 0.75
        },
        "weaponCoefficient": 1,
        "hitChance": 0.3,
        "criticalChance": 0.08
      },
      {
        "id": "sword-eagle",
        "name": "惊鸿剑",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.4,
        "effects": [],
        "scaling": {
          "war": 3.75,
          "technique": 1
        },
        "weaponCoefficient": 1,
        "hitChance": 0.5,
        "criticalChance": 0.03
      },
      {
        "id": "sword-critical",
        "name": "孤锋绝命",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 2.5,
        "effects": [],
        "scaling": {
          "war": 4.8
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.25
      }
    ],
    "daySkills": [
      {
        "id": "sword-break-day",
        "name": "破甲剑",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 2,
        "effects": [
          {
            "id": "armorDown",
            "duration": 8,
            "chance": 0.4,
            "base": 3,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "armor",
            "negative": true
          }
        ],
        "scaling": {
          "war": 0.85
        },
        "weaponCoefficient": 1,
        "hitChance": 0.3,
        "criticalChance": 0.08
      },
      {
        "id": "sword-eagle-day",
        "name": "惊鸿剑",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.4,
        "effects": [],
        "scaling": {
          "war": 4.5,
          "technique": 1.2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.5,
        "criticalChance": 0.03
      },
      {
        "id": "sword-critical-day",
        "name": "孤锋绝命",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 2.5,
        "effects": [],
        "scaling": {
          "war": 5.8
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.35
      }
    ],
    "style": "精准剑术"
  },
  {
    "id": "spear",
    "name": "枪",
    "role": "嘲讽反伤",
    "group": "warrior",
    "ordinaryName": "铁枪",
    "skills": [
      {
        "id": "shield-hit",
        "name": "震敌枪击",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.2,
        "effects": [],
        "scaling": {
          "war": 2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.1
      },
      {
        "id": "shield-taunt",
        "name": "横枪立阵",
        "kind": "buff",
        "side": "self",
        "scope": "single",
        "cost": 0,
        "cooldown": 0.8,
        "effects": [
          {
            "id": "armorUp",
            "attribute": "armor",
            "duration": 30,
            "base": 8,
            "stat": "war",
            "coefficient": 0.1
          }
        ],
        "buff": {
          "id": "taunt",
          "name": "嘲讽",
          "taunt": true,
          "duration": 30
        }
      },
      {
        "id": "shield-reflect",
        "name": "回马反击",
        "kind": "buff",
        "side": "self",
        "scope": "single",
        "cost": 0,
        "cooldown": -1,
        "effects": [],
        "buff": {
          "id": "reflectDamage",
          "name": "反伤",
          "duration": 45,
          "reflectFormula": {
            "base": 0.2,
            "stat": "technique",
            "coefficient": 0.001
          }
        }
      }
    ],
    "daySkills": [
      {
        "id": "shield-hit-day",
        "name": "震敌枪击",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.2,
        "effects": [],
        "scaling": {
          "war": 2.4
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.1
      },
      {
        "id": "shield-taunt-day",
        "name": "横枪立阵",
        "kind": "buff",
        "side": "self",
        "scope": "single",
        "cost": 0,
        "cooldown": 0.6,
        "effects": [
          {
            "id": "armorUp",
            "attribute": "armor",
            "duration": 30,
            "base": 8,
            "stat": "war",
            "coefficient": 0.1
          }
        ],
        "buff": {
          "id": "taunt",
          "name": "嘲讽",
          "taunt": true,
          "duration": 30
        }
      },
      {
        "id": "shield-reflect-day",
        "name": "回马反击",
        "kind": "buff",
        "side": "self",
        "scope": "single",
        "cost": 0,
        "cooldown": -1,
        "effects": [],
        "buff": {
          "id": "reflectDamage",
          "name": "反伤",
          "duration": 45,
          "reflectFormula": {
            "base": 0.2,
            "stat": "technique",
            "coefficient": 0.001
          }
        }
      }
    ],
    "style": "守御反击"
  },
  {
    "id": "halberd",
    "name": "戟",
    "role": "群体物理",
    "group": "berserker",
    "ordinaryName": "长戟",
    "skills": [
      {
        "id": "halberd-cut",
        "name": "横戟击",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [],
        "scaling": {
          "war": 2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.08
      },
      {
        "id": "halberd-burst",
        "name": "霸戟破军",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 2,
        "effects": [],
        "scaling": {
          "war": 3.8
        },
        "weaponCoefficient": 1,
        "hitChance": 0.25,
        "criticalChance": 0.12
      },
      {
        "id": "halberd-sweep",
        "name": "八方裂阵",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 2,
        "effects": [],
        "scaling": {
          "war": 2.35
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.13
      }
    ],
    "daySkills": [
      {
        "id": "halberd-cut-day",
        "name": "横戟击",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [],
        "scaling": {
          "war": 2.4
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.08
      },
      {
        "id": "halberd-burst-day",
        "name": "霸戟破军",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 2,
        "effects": [],
        "scaling": {
          "war": 4.5
        },
        "weaponCoefficient": 1,
        "hitChance": 0.25,
        "criticalChance": 0.12
      },
      {
        "id": "halberd-sweep-day",
        "name": "八方裂阵",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 2,
        "effects": [],
        "scaling": {
          "war": 2.8
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.13
      }
    ],
    "style": "横戟破军"
  },
  {
    "id": "shield",
    "name": "盾",
    "role": "破甲控制",
    "group": "warrior",
    "ordinaryName": "圆盾",
    "skills": [
      {
        "id": "spear-break",
        "name": "破阵盾击",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 2,
        "effects": [
          {
            "id": "armorDown",
            "duration": 8,
            "chance": 0.65,
            "base": 3,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "armor",
            "negative": true
          }
        ],
        "scaling": {
          "war": 0.8
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.08
      },
      {
        "id": "spear-stun",
        "name": "冲阵盾击",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1,
        "effects": [
          {
            "id": "stun",
            "duration": 7,
            "chance": 0.65,
            "stun": true
          }
        ],
        "scaling": {
          "war": 1.5
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.12
      },
      {
        "id": "spear-burst",
        "name": "震山重击",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 2.5,
        "effects": [],
        "scaling": {
          "war": 3.2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.25
      }
    ],
    "daySkills": [
      {
        "id": "spear-break-day",
        "name": "破阵盾击",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 2,
        "effects": [
          {
            "id": "armorDown",
            "duration": 8,
            "chance": 0.7,
            "base": 3,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "armor",
            "negative": true
          }
        ],
        "scaling": {
          "war": 0.95
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.08
      },
      {
        "id": "spear-stun-day",
        "name": "冲阵盾击",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1,
        "effects": [
          {
            "id": "stun",
            "duration": 7,
            "chance": 0.65,
            "stun": true
          }
        ],
        "scaling": {
          "war": 1.8
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.12
      },
      {
        "id": "spear-burst-day",
        "name": "震山重击",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 2.5,
        "effects": [],
        "scaling": {
          "war": 3.8
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.35
      }
    ],
    "style": "破阵盾术"
  },
  {
    "id": "staff",
    "name": "杖",
    "role": "火计输出",
    "group": "mage",
    "ordinaryName": "木杖",
    "skills": [
      {
        "id": "staff-fire",
        "name": "烈火诀",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.8,
        "effects": [
          {
            "id": "burn",
            "duration": 6,
            "chance": 0.5,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "intelligence": 2.55
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.17,
        "raceBonuses": {
          "spirit": 0.3
        },
        "element": "fire"
      },
      {
        "id": "staff-flame",
        "name": "燎原术",
        "kind": "tactic",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 3,
        "effects": [
          {
            "id": "burn",
            "duration": 6,
            "chance": 0.65,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "intelligence": 1.3
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.05,
        "raceBonuses": {
          "spirit": 0.3
        },
        "element": "fire"
      },
      {
        "id": "staff-focus",
        "name": "清心诀",
        "kind": "heal",
        "side": "ally",
        "scope": "all",
        "cost": 0,
        "cooldown": 3,
        "effects": [
          {
            "id": "techniqueUp",
            "duration": 15,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "technique"
          }
        ],
        "scaling": {
          "intelligence": 0.5
        },
        "weaponCoefficient": 1
      }
    ],
    "daySkills": [
      {
        "id": "staff-fire-day",
        "name": "烈火诀",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.8,
        "effects": [
          {
            "id": "burn",
            "duration": 6,
            "chance": 0.7,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "intelligence": 3.3
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.17,
        "raceBonuses": {
          "spirit": 0.35
        },
        "element": "fire"
      },
      {
        "id": "staff-flame-day",
        "name": "燎原术",
        "kind": "tactic",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 3,
        "effects": [
          {
            "id": "burn",
            "duration": 6,
            "chance": 0.65,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "intelligence": 1.55
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.05,
        "raceBonuses": {
          "spirit": 0.35
        },
        "element": "fire"
      },
      {
        "id": "staff-focus-day",
        "name": "清心诀",
        "kind": "heal",
        "side": "ally",
        "scope": "all",
        "cost": 0,
        "cooldown": 3,
        "effects": [
          {
            "id": "techniqueUp",
            "duration": 15,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "technique"
          }
        ],
        "scaling": {
          "intelligence": 0.6
        },
        "weaponCoefficient": 1
      }
    ],
    "style": "烈焰术法"
  },
  {
    "id": "fan",
    "name": "扇",
    "role": "治疗增益",
    "group": "mage",
    "ordinaryName": "羽扇",
    "skills": [
      {
        "id": "fan-fire",
        "name": "火攻计",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 2,
        "effects": [
          {
            "id": "burn",
            "duration": 5,
            "chance": 0.4,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "intelligence": 2.45
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.15,
        "raceBonuses": {
          "spirit": 0.3
        },
        "element": "fire"
      },
      {
        "id": "fan-frost",
        "name": "寒风阵",
        "kind": "tactic",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 3,
        "effects": [
          {
            "id": "speedDown",
            "duration": 6,
            "chance": 0.6,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "speed",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 1.3
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.05,
        "raceBonuses": {
          "spirit": 0.3
        },
        "element": "water"
      },
      {
        "id": "fan-rain",
        "name": "清风化雨",
        "kind": "heal",
        "side": "ally",
        "scope": "all",
        "cost": 0,
        "cooldown": 3,
        "effects": [
          {
            "id": "techniqueUp",
            "duration": 15,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.3,
            "attribute": "technique"
          }
        ],
        "scaling": {
          "intelligence": 0.6
        },
        "weaponCoefficient": 1
      }
    ],
    "daySkills": [
      {
        "id": "fan-fire-day",
        "name": "火攻计",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 2,
        "effects": [
          {
            "id": "burn",
            "duration": 5,
            "chance": 0.4,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "intelligence": 2.95
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.15,
        "raceBonuses": {
          "spirit": 0.35
        },
        "element": "fire"
      },
      {
        "id": "fan-frost-day",
        "name": "寒风阵",
        "kind": "tactic",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 3,
        "effects": [
          {
            "id": "speedDown",
            "duration": 6,
            "chance": 0.6,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "speed",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 1.55
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.05,
        "raceBonuses": {
          "spirit": 0.35
        },
        "element": "water"
      },
      {
        "id": "fan-rain-day",
        "name": "清风化雨",
        "kind": "heal",
        "side": "ally",
        "scope": "all",
        "cost": 0,
        "cooldown": 3,
        "effects": [
          {
            "id": "techniqueUp",
            "duration": 15,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.3,
            "attribute": "technique"
          }
        ],
        "scaling": {
          "intelligence": 0.7
        },
        "weaponCoefficient": 1
      }
    ],
    "style": "风火兼修"
  },
  {
    "id": "qin",
    "name": "琴",
    "role": "削弱控制",
    "group": "mage",
    "ordinaryName": "古琴",
    "skills": [
      {
        "id": "qin-confusion",
        "name": "迷魂曲",
        "kind": "tactic",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 2.5,
        "effects": [
          {
            "id": "techniqueDown",
            "duration": 6,
            "chance": 0.75,
            "base": 10,
            "stat": "technique",
            "coefficient": 0.3,
            "attribute": "technique",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 1.55
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.05,
        "element": "earth"
      },
      {
        "id": "qin-drain",
        "name": "摄魂音",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [],
        "scaling": {
          "intelligence": 1.8
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.06,
        "lifesteal": 0.5,
        "element": "earth"
      },
      {
        "id": "qin-slow",
        "name": "缓弦咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.3,
        "effects": [
          {
            "id": "speedDown",
            "duration": 10,
            "chance": 0.8,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.75,
            "attribute": "speed",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.5,
        "criticalChance": 0.05,
        "element": "wood"
      }
    ],
    "daySkills": [
      {
        "id": "qin-confusion-day",
        "name": "迷魂曲",
        "kind": "tactic",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 2.5,
        "effects": [
          {
            "id": "techniqueDown",
            "duration": 6,
            "chance": 0.75,
            "base": 10,
            "stat": "technique",
            "coefficient": 0.3,
            "attribute": "technique",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 1.85
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.05,
        "element": "earth"
      },
      {
        "id": "qin-drain-day",
        "name": "摄魂音",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [],
        "scaling": {
          "intelligence": 2.15
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.06,
        "lifesteal": 0.5,
        "element": "earth"
      },
      {
        "id": "qin-slow-day",
        "name": "缓弦咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.3,
        "effects": [
          {
            "id": "speedDown",
            "duration": 10,
            "chance": 0.8,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.75,
            "attribute": "speed",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 2.4
        },
        "weaponCoefficient": 1,
        "hitChance": 0.5,
        "criticalChance": 0.05,
        "element": "wood"
      }
    ],
    "style": "惑心琴术"
  },
  {
    "id": "dagger",
    "name": "匕首",
    "role": "高速刺杀",
    "group": "assassin",
    "ordinaryName": "短匕",
    "skills": [
      {
        "id": "dagger-bleed",
        "name": "断筋刺",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 0.5,
        "effects": [
          {
            "id": "bleed",
            "duration": 8,
            "chance": 0.8,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 1.5
        },
        "weaponCoefficient": 1,
        "hitChance": 0.42,
        "criticalChance": 0.18
      },
      {
        "id": "dagger-fast",
        "name": "无影连刺",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": -1.2,
        "effects": [],
        "scaling": {
          "war": 0.8
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.4
      },
      {
        "id": "dagger-poison",
        "name": "淬毒刺",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 0.6,
        "effects": [
          {
            "id": "plague",
            "duration": 8,
            "chance": 0.7,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 1.55
        },
        "weaponCoefficient": 1,
        "hitChance": 0.42,
        "criticalChance": 0.15
      }
    ],
    "daySkills": [
      {
        "id": "dagger-bleed-day",
        "name": "断筋刺",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 0.5,
        "effects": [
          {
            "id": "bleed",
            "duration": 8,
            "chance": 0.8,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 1.8
        },
        "weaponCoefficient": 1,
        "hitChance": 0.42,
        "criticalChance": 0.18
      },
      {
        "id": "dagger-fast-day",
        "name": "无影连刺",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": -1.2,
        "effects": [],
        "scaling": {
          "war": 0.95,
          "speed": 0.05
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.4
      },
      {
        "id": "dagger-poison-day",
        "name": "淬毒刺",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 0.6,
        "effects": [
          {
            "id": "plague",
            "duration": 8,
            "chance": 0.7,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 1.85
        },
        "weaponCoefficient": 1,
        "hitChance": 0.42,
        "criticalChance": 0.15
      }
    ],
    "style": "无影疾杀"
  },
  {
    "id": "bow",
    "name": "弓",
    "role": "猎兽持续伤",
    "group": "ranger",
    "ordinaryName": "长弓",
    "skills": [
      {
        "id": "bow-fire",
        "name": "火矢贯心",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1,
        "effects": [
          {
            "id": "burn",
            "duration": 8,
            "chance": 0.75,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 2.2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.08,
        "raceBonuses": {
          "beast": 2
        },
        "element": "fire"
      },
      {
        "id": "bow-poison",
        "name": "毒矢追魂",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "plague",
            "duration": 8,
            "chance": 0.7,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.43,
        "criticalChance": 0.06,
        "lifesteal": 0.3
      },
      {
        "id": "bow-recover",
        "name": "敛息回元",
        "kind": "heal",
        "side": "self",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "speedUp",
            "duration": 12,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "speed"
          }
        ],
        "scaling": {
          "intelligence": 2
        },
        "weaponCoefficient": 1
      }
    ],
    "daySkills": [
      {
        "id": "bow-fire-day",
        "name": "火矢贯心",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1,
        "effects": [
          {
            "id": "burn",
            "duration": 8,
            "chance": 0.8,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 2.65
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.08,
        "raceBonuses": {
          "beast": 2
        },
        "element": "fire"
      },
      {
        "id": "bow-poison-day",
        "name": "毒矢追魂",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "plague",
            "duration": 8,
            "chance": 0.75,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 2.4
        },
        "weaponCoefficient": 1,
        "hitChance": 0.43,
        "criticalChance": 0.06,
        "lifesteal": 0.3
      },
      {
        "id": "bow-recover-day",
        "name": "敛息回元",
        "kind": "heal",
        "side": "self",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "speedUp",
            "duration": 12,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "speed"
          }
        ],
        "scaling": {
          "intelligence": 2.4
        },
        "weaponCoefficient": 1
      }
    ],
    "style": "毒火猎袭"
  },
  {
    "id": "crossbow",
    "name": "弩",
    "role": "狙击压制",
    "group": "ranger",
    "ordinaryName": "手弩",
    "skills": [
      {
        "id": "crossbow-shot",
        "name": "穿云弩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1,
        "effects": [],
        "scaling": {
          "war": 1.25,
          "technique": 0.8
        },
        "weaponCoefficient": 1,
        "hitChance": 0.43,
        "criticalChance": 0.08,
        "raceBonuses": {
          "humanoid": 2
        }
      },
      {
        "id": "crossbow-volley",
        "name": "连弩齐发",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "stun",
            "duration": 0.5,
            "chance": 0.55,
            "stun": true
          }
        ],
        "scaling": {
          "war": 0.85,
          "technique": 0.55
        },
        "weaponCoefficient": 1,
        "hitChance": 0.38,
        "criticalChance": 0.1,
        "raceBonuses": {
          "humanoid": 0.3
        }
      },
      {
        "id": "crossbow-snipe",
        "name": "狙心矢",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 2.5,
        "effects": [],
        "scaling": {
          "war": 1.55,
          "technique": 1.05
        },
        "weaponCoefficient": 1,
        "hitChance": 0.43,
        "criticalChance": 0.15,
        "ignoreTaunt": true,
        "raceBonuses": {
          "humanoid": 0.3
        }
      }
    ],
    "daySkills": [
      {
        "id": "crossbow-shot-day",
        "name": "穿云弩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1,
        "effects": [],
        "scaling": {
          "war": 1.5,
          "technique": 0.95
        },
        "weaponCoefficient": 1,
        "hitChance": 0.43,
        "criticalChance": 0.08,
        "raceBonuses": {
          "humanoid": 2
        }
      },
      {
        "id": "crossbow-volley-day",
        "name": "连弩齐发",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "stun",
            "duration": 1,
            "chance": 0.55,
            "stun": true
          }
        ],
        "scaling": {
          "war": 1,
          "technique": 0.65
        },
        "weaponCoefficient": 1,
        "hitChance": 0.38,
        "criticalChance": 0.1,
        "raceBonuses": {
          "humanoid": 0.35
        }
      },
      {
        "id": "crossbow-snipe-day",
        "name": "狙心矢",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 2.5,
        "effects": [],
        "scaling": {
          "war": 1.85,
          "technique": 1.25
        },
        "weaponCoefficient": 1,
        "hitChance": 0.43,
        "criticalChance": 0.15,
        "ignoreTaunt": true,
        "raceBonuses": {
          "humanoid": 0.35
        }
      }
    ],
    "style": "穿云狙击"
  },
  {
    "id": "needle",
    "name": "金针",
    "role": "单体急救",
    "group": "healer",
    "ordinaryName": "银针",
    "skills": [
      {
        "id": "needle-stun",
        "name": "截脉针",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.3,
        "effects": [
          {
            "id": "stun",
            "duration": 7,
            "chance": 0.5,
            "stun": true
          }
        ],
        "scaling": {
          "war": 1.25,
          "intelligence": 0.85
        },
        "weaponCoefficient": 1,
        "hitChance": 0.47,
        "criticalChance": 0.08,
        "raceBonuses": {
          "dark": 0.4
        }
      },
      {
        "id": "needle-heal",
        "name": "回天针",
        "kind": "heal",
        "side": "ally",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.8,
        "effects": [
          {
            "id": "armorUp",
            "duration": 8,
            "base": 2,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "armor"
          }
        ],
        "scaling": {
          "intelligence": 1.5
        },
        "weaponCoefficient": 1
      },
      {
        "id": "needle-sacrifice",
        "name": "舍身护众",
        "kind": "buff",
        "side": "self",
        "scope": "single",
        "cost": 0,
        "cooldown": 0.6,
        "effects": [
          {
            "id": "armorUp",
            "attribute": "armor",
            "duration": 30,
            "base": 8,
            "stat": "war",
            "coefficient": 0.1
          }
        ],
        "buff": {
          "id": "taunt",
          "name": "嘲讽",
          "taunt": true,
          "duration": 30
        }
      }
    ],
    "daySkills": [
      {
        "id": "needle-stun-day",
        "name": "截脉针",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.3,
        "effects": [
          {
            "id": "stun",
            "duration": 7,
            "chance": 0.5,
            "stun": true
          }
        ],
        "scaling": {
          "war": 1.5,
          "intelligence": 1
        },
        "weaponCoefficient": 1,
        "hitChance": 0.47,
        "criticalChance": 0.08,
        "raceBonuses": {
          "dark": 0.4
        }
      },
      {
        "id": "needle-heal-day",
        "name": "回天针",
        "kind": "heal",
        "side": "ally",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.8,
        "effects": [
          {
            "id": "armorUp",
            "duration": 8,
            "base": 2,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "armor"
          }
        ],
        "scaling": {
          "intelligence": 1.8
        },
        "weaponCoefficient": 1
      },
      {
        "id": "needle-sacrifice-day",
        "name": "舍身护众",
        "kind": "buff",
        "side": "self",
        "scope": "single",
        "cost": 0,
        "cooldown": 0.6,
        "effects": [
          {
            "id": "armorUp",
            "attribute": "armor",
            "duration": 30,
            "base": 8,
            "stat": "war",
            "coefficient": 0.1
          }
        ],
        "buff": {
          "id": "taunt",
          "name": "嘲讽",
          "taunt": true,
          "duration": 30
        }
      }
    ],
    "style": "回天护脉"
  },
  {
    "id": "talisman",
    "name": "符箓",
    "role": "群疗抗性",
    "group": "healer",
    "ordinaryName": "符箓",
    "skills": [
      {
        "id": "talisman-thunder",
        "name": "雷符咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "resistanceDown",
            "duration": 14,
            "chance": 0.8,
            "base": 3,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "resistance",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 1.65
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.05,
        "element": "thunder"
      },
      {
        "id": "talisman-rain",
        "name": "太平甘霖",
        "kind": "heal",
        "side": "ally",
        "scope": "all",
        "cost": 0,
        "cooldown": 3.5,
        "effects": [
          {
            "id": "resistanceUp",
            "duration": 7,
            "base": 2,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "resistance"
          }
        ],
        "scaling": {
          "intelligence": 0.85
        },
        "weaponCoefficient": 1
      },
      {
        "id": "talisman-clear",
        "name": "荡秽符",
        "kind": "tactic",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [],
        "scaling": {
          "intelligence": 1.1
        },
        "weaponCoefficient": 1,
        "hitChance": 0.38,
        "criticalChance": 0.15,
        "raceBonuses": {
          "dark": 1.6
        },
        "element": "earth"
      }
    ],
    "daySkills": [
      {
        "id": "talisman-thunder-day",
        "name": "雷符咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "resistanceDown",
            "duration": 14,
            "chance": 0.8,
            "base": 3,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "resistance",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.05,
        "element": "thunder"
      },
      {
        "id": "talisman-rain-day",
        "name": "太平甘霖",
        "kind": "heal",
        "side": "ally",
        "scope": "all",
        "cost": 0,
        "cooldown": 3.5,
        "effects": [
          {
            "id": "resistanceUp",
            "duration": 7,
            "base": 2,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "resistance"
          }
        ],
        "scaling": {
          "intelligence": 1
        },
        "weaponCoefficient": 1
      },
      {
        "id": "talisman-clear-day",
        "name": "荡秽符",
        "kind": "tactic",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [],
        "scaling": {
          "intelligence": 1.3
        },
        "weaponCoefficient": 1,
        "hitChance": 0.38,
        "criticalChance": 0.15,
        "raceBonuses": {
          "dark": 1.6
        },
        "element": "earth"
      }
    ],
    "style": "雷符济世"
  },
  {
    "id": "gourd",
    "name": "药葫芦",
    "role": "持续回复",
    "group": "mage",
    "ordinaryName": "药葫芦",
    "skills": [
      {
        "id": "gourd-poison",
        "name": "蚀骨蛊",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "plague",
            "duration": 8,
            "chance": 0.75,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "intelligence": 1.75
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.1,
        "element": "wood"
      },
      {
        "id": "gourd-curse",
        "name": "厄运咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 2,
        "effects": [
          {
            "id": "stun",
            "duration": 5,
            "chance": 0.6,
            "stun": true
          }
        ],
        "scaling": {
          "intelligence": 2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.1,
        "element": "earth"
      },
      {
        "id": "gourd-regeneration",
        "name": "青囊回春",
        "kind": "heal",
        "side": "ally",
        "scope": "single",
        "cost": 0,
        "cooldown": 3,
        "effects": [
          {
            "id": "regeneration",
            "duration": 12,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.5,
            "period": 1,
            "healing": true
          }
        ],
        "scaling": {
          "intelligence": 0.75
        },
        "weaponCoefficient": 1
      }
    ],
    "daySkills": [
      {
        "id": "gourd-poison-day",
        "name": "蚀骨蛊",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "plague",
            "duration": 8,
            "chance": 0.75,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "intelligence": 2.1
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.1,
        "element": "wood"
      },
      {
        "id": "gourd-curse-day",
        "name": "厄运咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 2,
        "effects": [
          {
            "id": "stun",
            "duration": 5,
            "chance": 0.6,
            "stun": true
          }
        ],
        "scaling": {
          "intelligence": 2.4
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.1,
        "element": "earth"
      },
      {
        "id": "gourd-regeneration-day",
        "name": "青囊回春",
        "kind": "heal",
        "side": "ally",
        "scope": "single",
        "cost": 0,
        "cooldown": 3,
        "effects": [
          {
            "id": "regeneration",
            "duration": 12,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.5,
            "period": 1,
            "healing": true
          }
        ],
        "scaling": {
          "intelligence": 0.9
        },
        "weaponCoefficient": 1
      }
    ],
    "style": "蛊毒回春"
  },
  {
    "id": "dualSword",
    "name": "双剑",
    "role": "武智双修",
    "group": "warrior",
    "ordinaryName": "双剑",
    "skills": [
      {
        "id": "dualSword-1",
        "name": "奔雷斩",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 2,
        "effects": [
          {
            "id": "speedDown",
            "duration": 6,
            "chance": 0.7,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "speed",
            "negative": true
          }
        ],
        "scaling": {
          "war": 2.6,
          "intelligence": 1
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.08
      },
      {
        "id": "dualSword-2",
        "name": "引风斩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1,
        "effects": [
          {
            "id": "intelligenceUp",
            "duration": 10,
            "chance": 1,
            "base": 0,
            "stat": "technique",
            "coefficient": 0.5,
            "attribute": "intelligence",
            "recipient": "self"
          }
        ],
        "scaling": {
          "war": 3,
          "intelligence": 1.5
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.12,
        "ignoreTaunt": true,
        "lifesteal": 0.5
      },
      {
        "id": "dualSword-3",
        "name": "烈焰斩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "burn",
            "duration": 8,
            "chance": 0.8,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 1.5,
          "intelligence": 1.1
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.1,
        "element": "fire"
      }
    ],
    "daySkills": [
      {
        "id": "dualSword-1-day",
        "name": "奔雷斩",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 2,
        "effects": [
          {
            "id": "speedDown",
            "duration": 6,
            "chance": 0.75,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "speed",
            "negative": true
          }
        ],
        "scaling": {
          "war": 3.2,
          "intelligence": 1.25
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.08
      },
      {
        "id": "dualSword-2-day",
        "name": "引风斩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1,
        "effects": [
          {
            "id": "intelligenceUp",
            "duration": 10,
            "chance": 1,
            "base": 0,
            "stat": "technique",
            "coefficient": 0.5,
            "attribute": "intelligence",
            "recipient": "self"
          }
        ],
        "scaling": {
          "war": 3.5,
          "intelligence": 2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.12,
        "ignoreTaunt": true,
        "lifesteal": 0.5
      },
      {
        "id": "dualSword-3-day",
        "name": "烈焰斩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "burn",
            "duration": 8,
            "chance": 0.8,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 1.8,
          "intelligence": 1.3
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.1,
        "element": "fire"
      }
    ],
    "style": "雷火剑诀"
  },
  {
    "id": "greatShield",
    "name": "重盾",
    "role": "承伤削弱",
    "group": "warrior",
    "ordinaryName": "重盾",
    "skills": [
      {
        "id": "greatShield-1",
        "name": "震盾击",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.2,
        "effects": [
          {
            "id": "stun",
            "duration": 5,
            "chance": 0.7,
            "stun": true
          }
        ],
        "scaling": {
          "war": 2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.1
      },
      {
        "id": "greatShield-2",
        "name": "坚壁挑衅",
        "kind": "buff",
        "side": "self",
        "scope": "single",
        "cost": 0,
        "cooldown": 0.8,
        "effects": [
          {
            "id": "armorUp",
            "attribute": "armor",
            "duration": 30,
            "base": 8,
            "stat": "constitution",
            "coefficient": 0.25
          }
        ],
        "buff": {
          "id": "taunt",
          "name": "嘲讽",
          "taunt": true,
          "duration": 30
        }
      },
      {
        "id": "greatShield-3",
        "name": "卸力斩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "warDown",
            "duration": 8,
            "chance": 0.7,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.5,
            "attribute": "war",
            "negative": true
          }
        ],
        "scaling": {
          "war": 2.15
        },
        "weaponCoefficient": 0,
        "hitChance": 0.45,
        "criticalChance": 0.1
      }
    ],
    "daySkills": [
      {
        "id": "greatShield-1-day",
        "name": "震盾击",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.2,
        "effects": [
          {
            "id": "stun",
            "duration": 5,
            "chance": 0.7,
            "stun": true
          }
        ],
        "scaling": {
          "war": 2.4
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.1
      },
      {
        "id": "greatShield-2-day",
        "name": "坚壁挑衅",
        "kind": "buff",
        "side": "self",
        "scope": "single",
        "cost": 0,
        "cooldown": 0.8,
        "effects": [
          {
            "id": "armorUp",
            "attribute": "armor",
            "duration": 30,
            "base": 8,
            "stat": "constitution",
            "coefficient": 0.25
          }
        ],
        "buff": {
          "id": "taunt",
          "name": "嘲讽",
          "taunt": true,
          "duration": 30
        }
      },
      {
        "id": "greatShield-3-day",
        "name": "卸力斩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "warDown",
            "duration": 8,
            "chance": 0.75,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.5,
            "attribute": "war",
            "negative": true
          }
        ],
        "scaling": {
          "war": 2.6
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.1
      }
    ],
    "style": "铁壁削弱"
  },
  {
    "id": "whisk",
    "name": "拂尘",
    "role": "冰术控制",
    "group": "mage",
    "ordinaryName": "拂尘",
    "skills": [
      {
        "id": "whisk-1",
        "name": "凝冰咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 2.2,
        "effects": [
          {
            "id": "stun",
            "duration": 6,
            "chance": 0.65,
            "stun": true
          }
        ],
        "scaling": {
          "intelligence": 2.5
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.15,
        "raceBonuses": {
          "spirit": 0.3
        },
        "element": "water"
      },
      {
        "id": "whisk-2",
        "name": "寒霜阵",
        "kind": "tactic",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 3,
        "effects": [
          {
            "id": "speedDown",
            "duration": 6,
            "chance": 0.75,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "speed",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 1.5
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.05,
        "raceBonuses": {
          "spirit": 0.3
        },
        "element": "water"
      },
      {
        "id": "whisk-3",
        "name": "静心咒",
        "kind": "heal",
        "side": "ally",
        "scope": "all",
        "cost": 0,
        "cooldown": 3,
        "effects": [
          {
            "id": "techniqueUp",
            "duration": 15,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "technique"
          }
        ],
        "scaling": {
          "intelligence": 0.5
        },
        "weaponCoefficient": 1
      }
    ],
    "daySkills": [
      {
        "id": "whisk-1-day",
        "name": "凝冰咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.8,
        "effects": [
          {
            "id": "stun",
            "duration": 6,
            "chance": 0.65,
            "stun": true
          }
        ],
        "scaling": {
          "intelligence": 3
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.15,
        "raceBonuses": {
          "spirit": 0.35
        },
        "element": "water"
      },
      {
        "id": "whisk-2-day",
        "name": "寒霜阵",
        "kind": "tactic",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 3,
        "effects": [
          {
            "id": "speedDown",
            "duration": 6,
            "chance": 0.75,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "speed",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 1.8
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.05,
        "raceBonuses": {
          "spirit": 0.35
        },
        "element": "water"
      },
      {
        "id": "whisk-3-day",
        "name": "静心咒",
        "kind": "heal",
        "side": "ally",
        "scope": "all",
        "cost": 0,
        "cooldown": 3,
        "effects": [
          {
            "id": "techniqueUp",
            "duration": 15,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "technique"
          }
        ],
        "scaling": {
          "intelligence": 0.6
        },
        "weaponCoefficient": 1
      }
    ],
    "style": "霜寒禁法"
  },
  {
    "id": "banner",
    "name": "法幡",
    "role": "流血吸取",
    "group": "mage",
    "ordinaryName": "法幡",
    "skills": [
      {
        "id": "banner-1",
        "name": "缚影咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.3,
        "effects": [
          {
            "id": "speedDown",
            "duration": 10,
            "chance": 0.7,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "speed",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.5,
        "criticalChance": 0.05,
        "element": "wood"
      },
      {
        "id": "banner-2",
        "name": "乱神咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 2.5,
        "effects": [
          {
            "id": "techniqueDown",
            "duration": 6,
            "chance": 0.75,
            "base": 10,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "technique",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 1.3
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.05,
        "element": "earth"
      },
      {
        "id": "banner-3",
        "name": "血引术",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "bleed",
            "duration": 6,
            "chance": 0.7,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "intelligence": 1.9
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.1,
        "lifesteal": 0.75,
        "element": "earth"
      }
    ],
    "daySkills": [
      {
        "id": "banner-1-day",
        "name": "缚影咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.3,
        "effects": [
          {
            "id": "speedDown",
            "duration": 10,
            "chance": 0.7,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "speed",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 2.4
        },
        "weaponCoefficient": 1,
        "hitChance": 0.5,
        "criticalChance": 0.05,
        "element": "wood"
      },
      {
        "id": "banner-2-day",
        "name": "乱神咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 2.5,
        "effects": [
          {
            "id": "techniqueDown",
            "duration": 6,
            "chance": 0.75,
            "base": 10,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "technique",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 1.55
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.05,
        "element": "earth"
      },
      {
        "id": "banner-3-day",
        "name": "血引术",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "bleed",
            "duration": 6,
            "chance": 0.7,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "intelligence": 2.3
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.1,
        "lifesteal": 0.75,
        "element": "earth"
      }
    ],
    "style": "血咒夺生"
  },
  {
    "id": "bell",
    "name": "法铃",
    "role": "削弱武力",
    "group": "mage",
    "ordinaryName": "法铃",
    "skills": [
      {
        "id": "bell-1",
        "name": "卸力咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "warDown",
            "duration": 10,
            "chance": 0.8,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.7,
            "attribute": "war",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.5,
        "criticalChance": 0.08,
        "element": "earth"
      },
      {
        "id": "bell-2",
        "name": "惑心咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 2.5,
        "effects": [
          {
            "id": "techniqueDown",
            "duration": 6,
            "chance": 0.75,
            "base": 10,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "technique",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 1.3
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.05,
        "element": "earth"
      },
      {
        "id": "bell-3",
        "name": "夺生咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [],
        "scaling": {
          "intelligence": 1.8
        },
        "weaponCoefficient": 0,
        "hitChance": 0.45,
        "criticalChance": 0.06,
        "lifesteal": 0.5,
        "element": "earth"
      }
    ],
    "daySkills": [
      {
        "id": "bell-1-day",
        "name": "卸力咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "warDown",
            "duration": 10,
            "chance": 0.8,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.7,
            "attribute": "war",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 2.4
        },
        "weaponCoefficient": 1,
        "hitChance": 0.5,
        "criticalChance": 0.08,
        "element": "earth"
      },
      {
        "id": "bell-2-day",
        "name": "惑心咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 2.5,
        "effects": [
          {
            "id": "techniqueDown",
            "duration": 6,
            "chance": 0.75,
            "base": 10,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "technique",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 1.55
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.05,
        "element": "earth"
      },
      {
        "id": "bell-3-day",
        "name": "夺生咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [],
        "scaling": {
          "intelligence": 2.15
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.06,
        "lifesteal": 0.5,
        "element": "earth"
      }
    ],
    "style": "虚弱咒法"
  },
  {
    "id": "drum",
    "name": "法鼓",
    "role": "削弱智力",
    "group": "mage",
    "ordinaryName": "法鼓",
    "skills": [
      {
        "id": "drum-1",
        "name": "疫毒咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "plague",
            "duration": 8,
            "chance": 0.7,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "intelligence": 1.9
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.1,
        "element": "wood"
      },
      {
        "id": "drum-2",
        "name": "摄魂咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 2,
        "effects": [
          {
            "id": "intelligenceDown",
            "duration": 5,
            "chance": 0.75,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.65,
            "attribute": "intelligence",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 1.85
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.1,
        "lifesteal": 0.3,
        "raceBonuses": {
          "humanoid": 0.3
        },
        "element": "earth"
      },
      {
        "id": "drum-3",
        "name": "回生咒",
        "kind": "heal",
        "side": "ally",
        "scope": "single",
        "cost": 0,
        "cooldown": 3,
        "effects": [
          {
            "id": "regeneration",
            "duration": 8,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.35,
            "period": 1,
            "healing": true
          }
        ],
        "scaling": {
          "intelligence": 0.65
        },
        "weaponCoefficient": 1
      }
    ],
    "daySkills": [
      {
        "id": "drum-1-day",
        "name": "疫毒咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "plague",
            "duration": 8,
            "chance": 0.7,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "intelligence": 2.3
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.1,
        "element": "wood"
      },
      {
        "id": "drum-2-day",
        "name": "摄魂咒",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 2,
        "effects": [
          {
            "id": "intelligenceDown",
            "duration": 8,
            "chance": 0.75,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.65,
            "attribute": "intelligence",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 2.2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.1,
        "lifesteal": 0.3,
        "raceBonuses": {
          "humanoid": 0.35
        },
        "element": "earth"
      },
      {
        "id": "drum-3-day",
        "name": "回生咒",
        "kind": "heal",
        "side": "ally",
        "scope": "single",
        "cost": 0,
        "cooldown": 3,
        "effects": [
          {
            "id": "regeneration",
            "duration": 8,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.35,
            "period": 1,
            "healing": true
          }
        ],
        "scaling": {
          "intelligence": 0.8
        },
        "weaponCoefficient": 1
      }
    ],
    "style": "摄魂巫术"
  },
  {
    "id": "scripture",
    "name": "经卷",
    "role": "群体破抗",
    "group": "healer",
    "ordinaryName": "经卷",
    "skills": [
      {
        "id": "scripture-1",
        "name": "破邪章",
        "kind": "tactic",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 2,
        "effects": [
          {
            "id": "resistanceDown",
            "duration": 8,
            "chance": 0.55,
            "base": 3,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "resistance",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 0.75
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.05,
        "element": "thunder"
      },
      {
        "id": "scripture-2",
        "name": "济世章",
        "kind": "heal",
        "side": "ally",
        "scope": "all",
        "cost": 0,
        "cooldown": 3.5,
        "effects": [
          {
            "id": "resistanceUp",
            "duration": 7,
            "base": 2,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "resistance"
          }
        ],
        "scaling": {
          "intelligence": 0.85
        },
        "weaponCoefficient": 1
      },
      {
        "id": "scripture-3",
        "name": "诛邪章",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [],
        "scaling": {
          "intelligence": 1.75
        },
        "weaponCoefficient": 1,
        "hitChance": 0.38,
        "criticalChance": 0.15,
        "raceBonuses": {
          "dark": 0.3
        },
        "element": "earth"
      }
    ],
    "daySkills": [
      {
        "id": "scripture-1-day",
        "name": "破邪章",
        "kind": "tactic",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 2,
        "effects": [
          {
            "id": "resistanceDown",
            "duration": 8,
            "chance": 0.6,
            "base": 3,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "resistance",
            "negative": true
          }
        ],
        "scaling": {
          "intelligence": 0.9
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.05,
        "element": "thunder"
      },
      {
        "id": "scripture-2-day",
        "name": "济世章",
        "kind": "heal",
        "side": "ally",
        "scope": "all",
        "cost": 0,
        "cooldown": 3.5,
        "effects": [
          {
            "id": "resistanceUp",
            "duration": 7,
            "base": 2,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "resistance"
          }
        ],
        "scaling": {
          "intelligence": 1
        },
        "weaponCoefficient": 1
      },
      {
        "id": "scripture-3-day",
        "name": "诛邪章",
        "kind": "tactic",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [],
        "scaling": {
          "intelligence": 2.1
        },
        "weaponCoefficient": 1,
        "hitChance": 0.38,
        "criticalChance": 0.15,
        "raceBonuses": {
          "dark": 0.3
        },
        "element": "earth"
      }
    ],
    "style": "镇邪祈术"
  },
  {
    "id": "club",
    "name": "棍",
    "role": "控制护佑",
    "group": "healer",
    "ordinaryName": "长棍",
    "skills": [
      {
        "id": "club-1",
        "name": "镇邪击",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.3,
        "effects": [
          {
            "id": "stun",
            "duration": 7,
            "chance": 0.7,
            "stun": true
          }
        ],
        "scaling": {
          "war": 1.35,
          "intelligence": 0.9
        },
        "weaponCoefficient": 1,
        "hitChance": 0.5,
        "criticalChance": 0.08,
        "raceBonuses": {
          "dark": 1.6
        }
      },
      {
        "id": "club-2",
        "name": "扶伤术",
        "kind": "heal",
        "side": "ally",
        "scope": "single",
        "cost": 0,
        "cooldown": 2,
        "effects": [
          {
            "id": "armorUp",
            "duration": 8,
            "base": 2,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "armor"
          }
        ],
        "scaling": {
          "intelligence": 1.4
        },
        "weaponCoefficient": 1
      },
      {
        "id": "club-3",
        "name": "舍身护众",
        "kind": "buff",
        "side": "self",
        "scope": "single",
        "cost": 0,
        "cooldown": 0.6,
        "effects": [
          {
            "id": "armorUp",
            "attribute": "armor",
            "duration": 30,
            "base": 8,
            "stat": "war",
            "coefficient": 0.1
          }
        ],
        "buff": {
          "id": "taunt",
          "name": "嘲讽",
          "taunt": true,
          "duration": 30
        }
      }
    ],
    "daySkills": [
      {
        "id": "club-1-day",
        "name": "镇邪击",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.3,
        "effects": [
          {
            "id": "stun",
            "duration": 7,
            "chance": 0.7,
            "stun": true
          }
        ],
        "scaling": {
          "war": 1.6,
          "intelligence": 1.1
        },
        "weaponCoefficient": 1,
        "hitChance": 0.5,
        "criticalChance": 0.08,
        "raceBonuses": {
          "dark": 1.6
        }
      },
      {
        "id": "club-2-day",
        "name": "扶伤术",
        "kind": "heal",
        "side": "ally",
        "scope": "single",
        "cost": 0,
        "cooldown": 2,
        "effects": [
          {
            "id": "armorUp",
            "duration": 8,
            "base": 2,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "armor"
          }
        ],
        "scaling": {
          "intelligence": 1.7
        },
        "weaponCoefficient": 1
      },
      {
        "id": "club-3-day",
        "name": "舍身护众",
        "kind": "buff",
        "side": "self",
        "scope": "single",
        "cost": 0,
        "cooldown": 0.6,
        "effects": [
          {
            "id": "armorUp",
            "attribute": "armor",
            "duration": 30,
            "base": 8,
            "stat": "war",
            "coefficient": 0.1
          }
        ],
        "buff": {
          "id": "taunt",
          "name": "嘲讽",
          "taunt": true,
          "duration": 30
        }
      }
    ],
    "style": "镇邪护持"
  },
  {
    "id": "throwingKnife",
    "name": "飞刀",
    "role": "加速扰乱",
    "group": "assassin",
    "ordinaryName": "飞刀",
    "skills": [
      {
        "id": "throwingKnife-1",
        "name": "暗影袭",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 0.3,
        "effects": [],
        "scaling": {
          "war": 1.75
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.08,
        "ignoreTaunt": true
      },
      {
        "id": "throwingKnife-2",
        "name": "飞刃舞",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "speedUp",
            "duration": 5,
            "chance": 1,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "speed",
            "recipient": "self"
          }
        ],
        "scaling": {
          "war": 1.4
        },
        "weaponCoefficient": 1,
        "hitChance": 0.3,
        "criticalChance": 0.15
      },
      {
        "id": "throwingKnife-3",
        "name": "迷烟刺",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "techniqueDown",
            "duration": 7,
            "chance": 0.8,
            "base": 10,
            "stat": "technique",
            "coefficient": 0.65,
            "attribute": "technique",
            "negative": true
          }
        ],
        "scaling": {
          "war": 1.4
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.05,
        "ignoreTaunt": true
      }
    ],
    "daySkills": [
      {
        "id": "throwingKnife-1-day",
        "name": "暗影袭",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 0.3,
        "effects": [],
        "scaling": {
          "war": 2.1
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.08,
        "ignoreTaunt": true
      },
      {
        "id": "throwingKnife-2-day",
        "name": "飞刃舞",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "speedUp",
            "duration": 7,
            "chance": 1,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "speed",
            "recipient": "self"
          }
        ],
        "scaling": {
          "war": 1.7
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.15
      },
      {
        "id": "throwingKnife-3-day",
        "name": "迷烟刺",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "techniqueDown",
            "duration": 7,
            "chance": 0.85,
            "base": 10,
            "stat": "technique",
            "coefficient": 0.65,
            "attribute": "technique",
            "negative": true
          }
        ],
        "scaling": {
          "war": 1.7
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.05,
        "ignoreTaunt": true
      }
    ],
    "style": "飞刃诡术"
  },
  {
    "id": "dart",
    "name": "飞镖",
    "role": "奇袭眩晕",
    "group": "assassin",
    "ordinaryName": "飞镖",
    "skills": [
      {
        "id": "dart-1",
        "name": "诡影袭",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 0.3,
        "effects": [
          {
            "id": "stun",
            "duration": 1.5,
            "chance": 0.8,
            "stun": true
          }
        ],
        "scaling": {
          "war": 1.65,
          "intelligence": 1.3
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.08,
        "ignoreTaunt": true,
        "raceBonuses": {
          "humanoid": 0.5
        }
      },
      {
        "id": "dart-2",
        "name": "流星镖",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "speedUp",
            "duration": 7,
            "chance": 1,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "speed",
            "recipient": "self"
          }
        ],
        "scaling": {
          "war": 1.25,
          "intelligence": 1
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.15
      },
      {
        "id": "dart-3",
        "name": "烟影镖",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "techniqueDown",
            "duration": 8,
            "chance": 0.8,
            "base": 10,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "technique",
            "negative": true
          }
        ],
        "scaling": {
          "war": 1.25,
          "intelligence": 1
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.05
      }
    ],
    "daySkills": [
      {
        "id": "dart-1-day",
        "name": "诡影袭",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 0.3,
        "effects": [
          {
            "id": "stun",
            "duration": 1.5,
            "chance": 0.85,
            "stun": true
          }
        ],
        "scaling": {
          "war": 2,
          "intelligence": 1.55
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.08,
        "ignoreTaunt": true,
        "raceBonuses": {
          "humanoid": 0.5
        }
      },
      {
        "id": "dart-2-day",
        "name": "流星镖",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "speedUp",
            "duration": 7,
            "chance": 1,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "speed",
            "recipient": "self"
          }
        ],
        "scaling": {
          "war": 1.5,
          "intelligence": 1.2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.15
      },
      {
        "id": "dart-3-day",
        "name": "烟影镖",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "techniqueDown",
            "duration": 8,
            "chance": 0.8,
            "base": 10,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "technique",
            "negative": true
          }
        ],
        "scaling": {
          "war": 1.5,
          "intelligence": 1.2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.05
      }
    ],
    "style": "幻影奇袭"
  },
  {
    "id": "hook",
    "name": "钩",
    "role": "流血瘟疫",
    "group": "assassin",
    "ordinaryName": "铁钩",
    "skills": [
      {
        "id": "hook-1",
        "name": "裂伤钩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "bleed",
            "duration": 8,
            "chance": 0.95,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.45,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 1.55
        },
        "weaponCoefficient": 1,
        "hitChance": 0.42,
        "criticalChance": 0.18
      },
      {
        "id": "hook-2",
        "name": "疾连钩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": -1,
        "effects": [],
        "scaling": {
          "war": 0.7
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.26
      },
      {
        "id": "hook-3",
        "name": "淬毒钩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.6,
        "effects": [
          {
            "id": "plague",
            "duration": 8,
            "chance": 0.85,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.45,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 1.6
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.15
      }
    ],
    "daySkills": [
      {
        "id": "hook-1-day",
        "name": "裂伤钩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "bleed",
            "duration": 8,
            "chance": 0.95,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.6,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 1.85
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.18
      },
      {
        "id": "hook-2-day",
        "name": "疾连钩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": -1,
        "effects": [],
        "scaling": {
          "war": 0.85
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.26
      },
      {
        "id": "hook-3-day",
        "name": "淬毒钩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.6,
        "effects": [
          {
            "id": "plague",
            "duration": 8,
            "chance": 0.9,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.6,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 1.9
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.15
      }
    ],
    "style": "疫毒撕裂"
  },
  {
    "id": "repeatingCrossbow",
    "name": "连弩",
    "role": "远程破甲",
    "group": "ranger",
    "ordinaryName": "连弩",
    "skills": [
      {
        "id": "repeatingCrossbow-1",
        "name": "穿阵矢",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1,
        "effects": [],
        "scaling": {
          "war": 2.05
        },
        "weaponCoefficient": 1,
        "hitChance": 0.43,
        "criticalChance": 0.08
      },
      {
        "id": "repeatingCrossbow-2",
        "name": "飞矢雨",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [],
        "scaling": {
          "war": 1.35
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.1
      },
      {
        "id": "repeatingCrossbow-3",
        "name": "破甲矢",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 2.3,
        "effects": [
          {
            "id": "armorDown",
            "duration": 9,
            "chance": 0.8,
            "base": 3,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "armor",
            "negative": true
          }
        ],
        "scaling": {
          "war": 2.7
        },
        "weaponCoefficient": 1,
        "hitChance": 0.43,
        "criticalChance": 0.15,
        "ignoreTaunt": true,
        "raceBonuses": {
          "humanoid": 0.3
        }
      }
    ],
    "daySkills": [
      {
        "id": "repeatingCrossbow-1-day",
        "name": "穿阵矢",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1,
        "effects": [],
        "scaling": {
          "war": 2.45
        },
        "weaponCoefficient": 1,
        "hitChance": 0.43,
        "criticalChance": 0.08
      },
      {
        "id": "repeatingCrossbow-2-day",
        "name": "飞矢雨",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [],
        "scaling": {
          "war": 1.6
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.1
      },
      {
        "id": "repeatingCrossbow-3-day",
        "name": "破甲矢",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 2.3,
        "effects": [
          {
            "id": "armorDown",
            "duration": 9,
            "chance": 0.8,
            "base": 3,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "armor",
            "negative": true
          }
        ],
        "scaling": {
          "war": 3.2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.43,
        "criticalChance": 0.15,
        "ignoreTaunt": true,
        "raceBonuses": {
          "humanoid": 0.3
        }
      }
    ],
    "style": "连矢破甲"
  },
  {
    "id": "greatBow",
    "name": "重弓",
    "role": "重箭猎龙",
    "group": "ranger",
    "ordinaryName": "重弓",
    "skills": [
      {
        "id": "greatBow-1",
        "name": "灼骨矢",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1,
        "effects": [
          {
            "id": "burn",
            "duration": 8,
            "chance": 0.7,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 2.1
        },
        "weaponCoefficient": 1,
        "hitChance": 0.43,
        "criticalChance": 0.08,
        "raceBonuses": {
          "beast": 0.4
        },
        "element": "fire"
      },
      {
        "id": "greatBow-2",
        "name": "猎龙矢",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.3,
        "effects": [
          {
            "id": "plague",
            "duration": 8,
            "chance": 0.75,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 2.15
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.06,
        "lifesteal": 0.25,
        "raceBonuses": {
          "dragon": 2
        }
      },
      {
        "id": "greatBow-3",
        "name": "急救术",
        "kind": "heal",
        "side": "self",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "speedUp",
            "duration": 12,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "speed"
          }
        ],
        "scaling": {
          "intelligence": 2
        },
        "weaponCoefficient": 1
      }
    ],
    "daySkills": [
      {
        "id": "greatBow-1-day",
        "name": "灼骨矢",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1,
        "effects": [
          {
            "id": "burn",
            "duration": 8,
            "chance": 0.7,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 2.5
        },
        "weaponCoefficient": 1,
        "hitChance": 0.43,
        "criticalChance": 0.08,
        "raceBonuses": {
          "beast": 0.4
        },
        "element": "fire"
      },
      {
        "id": "greatBow-2-day",
        "name": "猎龙矢",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.3,
        "effects": [
          {
            "id": "plague",
            "duration": 8,
            "chance": 0.75,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 2.6
        },
        "weaponCoefficient": 1,
        "hitChance": 0.45,
        "criticalChance": 0.06,
        "lifesteal": 0.25,
        "raceBonuses": {
          "dragon": 2
        }
      },
      {
        "id": "greatBow-3-day",
        "name": "急救术",
        "kind": "heal",
        "side": "self",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "speedUp",
            "duration": 12,
            "base": 5,
            "stat": "technique",
            "coefficient": 0.25,
            "attribute": "speed"
          }
        ],
        "scaling": {
          "intelligence": 2.4
        },
        "weaponCoefficient": 1
      }
    ],
    "style": "猎龙重射"
  },
  {
    "id": "hammer",
    "name": "锤",
    "role": "灼烧破邪",
    "group": "berserker",
    "ordinaryName": "铁锤",
    "skills": [
      {
        "id": "hammer-1",
        "name": "夺生锤",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1,
        "effects": [],
        "scaling": {
          "war": 2.2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.1,
        "lifesteal": 0.5
      },
      {
        "id": "hammer-2",
        "name": "怒焰锤",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "burn",
            "duration": 8,
            "chance": 0.8,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.3,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.07,
        "raceBonuses": {
          "dark": 1.6
        },
        "element": "fire"
      },
      {
        "id": "hammer-3",
        "name": "烈焰舞",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 2.5,
        "effects": [
          {
            "id": "burn",
            "duration": 6,
            "chance": 0.8,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.3,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 1.6
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.1,
        "raceBonuses": {
          "dark": 1.6
        },
        "element": "fire"
      }
    ],
    "daySkills": [
      {
        "id": "hammer-1-day",
        "name": "夺生锤",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1,
        "effects": [],
        "scaling": {
          "war": 2.65
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.08,
        "lifesteal": 0.5
      },
      {
        "id": "hammer-2-day",
        "name": "怒焰锤",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "burn",
            "duration": 8,
            "chance": 0.85,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.3,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 2.4
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.07,
        "raceBonuses": {
          "dark": 1.6
        },
        "element": "fire"
      },
      {
        "id": "hammer-3-day",
        "name": "烈焰舞",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 2.5,
        "effects": [
          {
            "id": "burn",
            "duration": 6,
            "chance": 0.85,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.3,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 1.9
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.1,
        "raceBonuses": {
          "dark": 1.6
        },
        "element": "fire"
      }
    ],
    "style": "焚邪火刑"
  },
  {
    "id": "axe",
    "name": "斧",
    "role": "群体吸血",
    "group": "berserker",
    "ordinaryName": "铁斧",
    "skills": [
      {
        "id": "axe-1",
        "name": "摄生斩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1,
        "effects": [],
        "scaling": {
          "war": 2.2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.08,
        "lifesteal": 0.65
      },
      {
        "id": "axe-2",
        "name": "焚骨斩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "burn",
            "duration": 8,
            "chance": 0.8,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 2
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.07,
        "element": "fire"
      },
      {
        "id": "axe-3",
        "name": "血旋斩",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 2.5,
        "effects": [],
        "scaling": {
          "war": 1.6
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.1,
        "lifesteal": 0.5
      }
    ],
    "daySkills": [
      {
        "id": "axe-1-day",
        "name": "摄生斩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1,
        "effects": [],
        "scaling": {
          "war": 2.65
        },
        "weaponCoefficient": 1,
        "hitChance": 0.4,
        "criticalChance": 0.1,
        "lifesteal": 0.7
      },
      {
        "id": "axe-2-day",
        "name": "焚骨斩",
        "kind": "physical",
        "side": "enemy",
        "scope": "single",
        "cost": 0,
        "cooldown": 1.5,
        "effects": [
          {
            "id": "burn",
            "duration": 8,
            "chance": 0.8,
            "base": 1,
            "stat": "technique",
            "coefficient": 0.25,
            "period": 1,
            "healing": false
          }
        ],
        "scaling": {
          "war": 2.4
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.07,
        "element": "fire"
      },
      {
        "id": "axe-3-day",
        "name": "血旋斩",
        "kind": "physical",
        "side": "enemy",
        "scope": "all",
        "cost": 0,
        "cooldown": 2.5,
        "effects": [],
        "scaling": {
          "war": 1.9
        },
        "weaponCoefficient": 1,
        "hitChance": 0.35,
        "criticalChance": 0.1,
        "lifesteal": 0.55
      }
    ],
    "style": "血旋收割"
  }
];
  // 数值模板独立保留，已停用的普通方向仍可供专武和旧存档引用。
  const clone=value=>JSON.parse(JSON.stringify(value)),old=Object.fromEntries(legacyTypes.map(t=>[t.id,t]));
  const plan=(id,from,name,group,archetype,style,ordinaryName,names)=>{
    const value={...clone(old[from]),id,name,group,archetype,style,ordinaryName};
    if(names)for(const list of [value.skills,value.daySkills])list.forEach((skill,i)=>{skill.name=names[i];});return value;
  };
  const types=[
    plan('sword','shield','剑','warrior','剑宗','破甲制敌','铁剑',['破甲剑','剑柄冲撞','杀机暴起']),
    plan('blade','sword','刀','warrior','剑豪','精准强攻','朴刀',['破甲刀','鹰落斩','杀机暴起']),
    plan('spear','spear','枪','warrior','圣龙将军','守御反击','木杆枪'),
    plan('shield','greatShield','盾','warrior','黑骑士','铁壁削弱','包铁盾'),
    plan('fan','staff','扇','mage','岩浆法师','烈焰术法','羽扇',['火羽诀','烈焰连营','清风化雨']),
    plan('staff','fan','杖','mage','传奇法师','雷法济世','木杖',['奔雷诀','惊雷阵','甘霖术']),
    plan('whisk','whisk','拂尘','mage','霜寒法师','霜寒禁法','拂尘'),
    plan('banner','banner','法幡','mage','血法师','血咒夺生','素幡'),
    plan('gourd','gourd','药葫芦','mage','巫医','蛊毒回春','药葫芦'),
    plan('scripture','scripture','经卷','healer','教宗','祈佑济世','医经'),
    plan('needle','needle','金针','healer','神官骑士','扶伤护持','金针'),
    plan('dagger','hook','匕首','assassin','夜莺','疫毒撕裂','匕首',['裂伤刺','疾连刺','淬毒刺']),
    plan('shortBlade','dagger','短刃','assassin','夜魇','无影疾杀','短刃'),
    plan('bow','crossbow','弓','ranger','圣枪侠','穿云狙击','木弓',['穿云箭','连珠箭','狙心矢']),
    plan('cannon','repeatingCrossbow','炮','ranger','烈枪侠','破甲连轰','轻炮',['穿阵炮','霰火轰','破甲炮']),
    plan('crossbow','bow','弩','ranger','传奇猎人','毒火猎袭','木弩'),
    plan('axe','blade','斧','berserker','狂战神','重斧强攻','铁斧',['横斧斩','乾坤一击','回旋斩']),
    plan('hammer','hammer','锤','berserker','火刑官','焚邪火刑','铁锤')
  ];
  for(const type of types)if(type.id==='staff')for(const list of [type.skills,type.daySkills])for(const skill of list)if(skill.kind==='tactic')skill.element='thunder';
  for(const type of types)if(type.id==='staff')for(const list of [type.skills,type.daySkills])for(const skill of list)skill.effects=(skill.effects||[]).map(e=>e.id==='burn'?{id:'paralysis',duration:e.duration||8,chance:e.chance??1,negative:true,speedMultiplier:.7}:e);
  const aliases={halberd:'spear',qin:'fan',talisman:'scripture',dualSword:'sword',greatShield:'shield',bell:'banner',drum:'gourd',club:'needle',throwingKnife:'shortBlade',dart:'shortBlade',hook:'dagger',repeatingCrossbow:'cannon',greatBow:'crossbow'};
  const legacyAliases={...aliases};
  function groupedTypes(){const result=groups.map(group=>({...group,types:types.filter(type=>type.group===group.id)})),other=types.filter(type=>!groups.some(group=>group.id===type.group));if(other.length)result.push({id:'other',name:'其他',types:other});return result.filter(group=>group.types.length);}
  function classification(weapon){if(!weapon)return null;const id=weapon.proficiencyType||aliases[weapon.type]||weapon.type,type=types.find(t=>t.id===id),group=groups.find(g=>g.id===type?.group);return type?{type,group}:null;}
  const api={groups,types,legacyTypes,aliases,legacyAliases,groupedTypes,classification};root.WeaponCatalog=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
