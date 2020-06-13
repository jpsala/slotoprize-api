import Axios from 'axios';
import os from 'os';

export default Axios.create({
  // baseURL: os.hostname() === 'jpnote' ? 'http://iae.dyndns.org/iae/index.php?r=apiApp/' : 'http://iae.dyndns.org/iae/index.php?r=apiApp/',
});
