const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('sqlite::memory:');

function getJsonDataType(name) {
    return {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
            const valstr = this.getDataValue(name);
            let val = null;
            try {
                val = JSON.parse(valstr || '[]');
            } catch (e) { }
            return val;
        },
        set(val) {
            if (typeof val !== 'string') {
                try {
                    val = JSON.stringify(val);
                } catch (e) {
                    val = null;
                }
            }
            this.setDataValue(name, val);
        }
    }
}

const User = sequelize.define({
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    display_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    is_admin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'users',
    timestamps: false
});

const Job = sequelize.define({
    job_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    alias: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    job_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    job_config: getJsonDataType('job_config'),
    update_policy: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'once'
    },
    last_update: {
        type: DataTypes.DATETIME
    }
}, {
    tableName: 'jobs',
    timestamps: false
});

const Source = sequelize.define({
    source_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    job_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    source_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    source_config: getJsonDataType('source_config'),
    update_policy: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'once'
    },
    last_update: {
        type: DataTypes.DATETIME
    }
}, {
    tableName: 'sources',
    timestamps: false
});

Job.hasMany(Source, {
    foreignKey: {
        name: 'job_id'
    }
});

Source.belongsTo(Job, {
    foreignKey: {
        name: 'job_id'
    }
});

const Item = sequelize.define({
    item_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    job_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    item_uri: {
        type: DataTypes.STRING,
        allowNull: false
    },
    item_body: getJsonDataType('item_body'),
    lock_timestamp: {
        type: DataTypes.DATETIME
    },
    is_processed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    last_update: {
        type: DataTypes.DATETIME
    }
}, {
    tableName: 'items',
    timestamps: false
});

Job.hasMany(Item, {
    foreignKey: {
        name: 'job_id'
    }
});

Item.belongsTo(Job, {
    foreignKey: {
        name: 'job_id'
    }
});

const Candidate = sequelize.define({
    candidate_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    item_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    candidate_uri: {
        type: DataTypes.STRING,
        allowNull: false
    },
    candidate_body: getJsonDataType('candidate_body'),
    score: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 1
    },
    is_selected: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    last_update: {
        type: DataTypes.DATETIME
    }
}, {
    tableName: 'candidates',
    timestamps: false
});

Item.hasMany(Candidate, {
    foreignKey: {
        name: 'item_id'
    }
});

Candidate.belongsTo(Item, {
    foreignKey: {
        name: 'item_id'
    }
});

const Action = sequelize.define({
    action_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    item_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    candidate_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    is_skipped: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    is_orphan: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    timestamp: {
        type: DataTypes.DATETIME,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'actions',
    timestamps: false
});

User.hasMany(Action, {
    foreignKey: {
        name: 'user_id'
    }
});

Action.belongsTo(User, {
    foreignKey: {
        name: 'user_id'
    }
});

Item.hasMany(Action, {
    foreignKey: {
        name: 'item_id'
    }
});

Action.belongsTo(Item, {
    foreignKey: {
        name: 'item_id'
    }
});

Candidate.hasMany(Action, {
    foreignKey: {
        name: 'candidate_id'
    }
});

Action.belongsTo(Candidate, {
    foreignKey: {
        name: 'candidate_id'
    }
});

(async () => {
    if (require.main === module) {
        // Create the database
        await sequelize.sync();
    }
})();

module.exports = {
    sequelize,
    User,
    Job,
    Source,
    Item,
    Candidate,
    Action
};