import _ from 'lodash';

class Utilities {
    static createError(code, msg, detail) {
        const err = new Error();
        err.code = code;
        err.message = msg;
        err.detail = detail;

        return err;
    }
}

export default Utilities;

