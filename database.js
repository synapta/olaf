require('dotenv').config();

const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URI || 'sqlite:db.sqlite', { logging: false });

const { JobTypes, SourceTypes } = require('./config');

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

const User = sequelize.define('User', {
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    display_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user',
        validate: {
            isIn: [['user', 'admin']]
        }
    },
    is_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    is_password_reset: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    registration_timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    last_password_update: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'Users',
    timestamps: false
});

const Job = sequelize.define('Job', {
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
        unique: true,
        validate: {
            isAlpha: true,
            isLowercase: true
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    job_type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isJobType(value) {
                const found = JobTypes.some(el => el.alias === value);
                if (!found) {
                    throw new Error('Job type is not valid!');
                }
            }
        }
    },
    job_config: getJsonDataType('job_config'),
    is_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    last_update: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'Jobs',
    timestamps: false
});

const Source = sequelize.define('Source', {
    source_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    job_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    source_type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isSourceType(value) {
                const found = SourceTypes.some(el => el.alias === value);
                if (!found) {
                    throw new Error('Source type is not valid!');
                }
            }
        }
    },
    source_config: getJsonDataType('source_config'),
    update_policy: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'once',
        validate: {
            isIn: [['once', 'disabled']]
        }
    },
    last_update: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'Sources',
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

const Item = sequelize.define('Item', {
    item_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    source_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    job_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    item_uri: {
        type: DataTypes.STRING,
        allowNull: false
    },
    item_search: {
        type: DataTypes.STRING,
        allowNull: false
    },
    item_body: getJsonDataType('item_body'),
    lock_timestamp: {
        type: DataTypes.DATE
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
        type: DataTypes.DATE
    }
}, {
    tableName: 'Items',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['job_id', 'item_uri']
        }
    ]
});

Source.hasMany(Item, {
    foreignKey: {
        name: 'source_id'
    }
});

Item.belongsTo(Source, {
    foreignKey: {
        name: 'source_id'
    }
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

const Candidate = sequelize.define('Candidate', {
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
        type: DataTypes.DATE
    }
}, {
    tableName: 'Candidates',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['item_id', 'candidate_uri']
        }
    ]
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

const Action = sequelize.define('Action', {
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
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'Actions',
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

const Log = sequelize.define('Log', {
    log_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    job_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    source_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    description: getJsonDataType('description'),
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'Logs',
    timestamps: false
});

(async () => {
    if (require.main === module) {
        // Create the database
        await sequelize.sync();
    }
})();

Job.hasMany(Log, {
    foreignKey: {
        name: 'job_id'
    }
});

Log.belongsTo(Job, {
    foreignKey: {
        name: 'job_id'
    }
});

Source.hasMany(Log, {
    foreignKey: {
        name: 'source_id'
    }
});

Log.belongsTo(Source, {
    foreignKey: {
        name: 'source_id'
    }
});

module.exports = {
    sequelize,
    User,
    Job,
    Source,
    Item,
    Candidate,
    Action,
    Log
};