(() => {
  const storageKey = 'dentacare-demo-v1';
  const state = {
    appointments: [],
    arrivals: [],
    patients: [],
    findings: [],
    notes: [],
    budgets: [],
    payments: [],
    prescriptions: [],
    assistanceRequests: [],
    selectedTooth: '16'
  };
  let toastTimer;

  function showToast(message, isError = false) {
    let toast = document.getElementById('appToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appToast';
      toast.setAttribute('role', 'status');
      toast.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:1000;max-width:calc(100vw - 32px);padding:12px 18px;border-radius:12px;color:#fff;background:#00685f;box-shadow:0 8px 24px #0b1c3040;font:600 14px Inter,Arial,sans-serif;text-align:center';
      document.body.appendChild(toast);
    }
    toast.style.background = isError ? '#ba1a1a' : '#00685f';
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3500);
  }

  function initAgenda() {
    document.querySelectorAll('#dateStrip button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.textContent.includes('15')));
    });
    if (state.arrivals.some(arrival => arrival.patient === 'Mateo Gómez' && arrival.status === 'En sillón')) {
      const arrivalButton = Array.from(document.querySelectorAll('#agendaTimeline button'))
        .find(button => normalize(button.textContent).includes('hacer pasar'));
      if (arrivalButton) {
        arrivalButton.textContent = 'En sillón';
        arrivalButton.disabled = true;
      }
    }
    if (state.turnFinished) {
      const activeCard = Array.from(document.querySelectorAll('#agendaTimeline > *'))
        .find(card => normalize(card.textContent).includes('sofia alarcon'));
      const status = activeCard && Array.from(activeCard.querySelectorAll('span'))
        .find(span => normalize(span.textContent).includes('en sillon'));
      if (status) status.textContent = 'Turno finalizado';
    }
  }

  function readState() {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) Object.assign(state, JSON.parse(stored));
    } catch (error) {
      console.error('No se pudieron leer los datos guardados de DentaCare.', error);
      showToast('No se pudieron recuperar los datos guardados en este navegador.', true);
    }
  }

  function saveState() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
      return true;
    } catch (error) {
      console.error('No se pudieron guardar los datos de DentaCare.', error);
      showToast('No se pudieron guardar los cambios. Revisa el almacenamiento del navegador.', true);
      return false;
    }
  }

  function makeDialog(title, message, options = {}) {
    const overlay = document.createElement('div');
    overlay.setAttribute('role', 'presentation');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:999;display:flex;align-items:center;justify-content:center;padding:20px;background:#0b1c3080;backdrop-filter:blur(4px)';
    const panel = document.createElement('section');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'appDialogTitle');
    panel.style.cssText = 'width:min(100%,440px);max-height:85vh;overflow:auto;background:#fff;border-radius:18px;padding:22px;box-shadow:0 18px 55px #0b1c3040;font:14px Inter,Arial,sans-serif;color:#0b1c30';
    const heading = document.createElement('h2');
    heading.id = 'appDialogTitle';
    heading.textContent = title;
    heading.style.cssText = 'margin:0 0 10px;font:600 20px "Plus Jakarta Sans",Inter,Arial,sans-serif';
    const description = document.createElement('p');
    description.textContent = message;
    description.style.cssText = 'margin:0 0 18px;line-height:1.55;color:#3d4947;white-space:pre-line';
    const buttons = document.createElement('div');
    buttons.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap';
    panel.append(heading, description, buttons);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.addEventListener('click', event => {
      if (event.target === overlay) close();
    });
    return { overlay, panel, buttons, close };
  }

  function showMessage(title, message) {
    const dialog = makeDialog(title, message);
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.textContent = 'Cerrar';
    closeButton.style.cssText = 'border:0;border-radius:10px;background:#00685f;color:#fff;padding:10px 16px;font-weight:600;cursor:pointer';
    closeButton.addEventListener('click', dialog.close);
    dialog.buttons.appendChild(closeButton);
    closeButton.focus();
  }

  function askForValue(title, label, initialValue = '', inputType = 'text') {
    return new Promise(resolve => {
      const dialog = makeDialog(title, label);
      const input = document.createElement('input');
      input.type = inputType;
      input.value = initialValue;
      input.required = true;
      if (inputType === 'number') {
        input.min = '0.01';
        input.step = '0.01';
      }
      input.setAttribute('aria-label', label);
      input.style.cssText = 'box-sizing:border-box;width:100%;margin:0 0 18px;padding:12px;border:1px solid #bcc9c6;border-radius:10px;font:14px Inter,Arial,sans-serif';
      dialog.panel.insertBefore(input, dialog.buttons);
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.textContent = 'Cancelar';
      cancel.style.cssText = 'border:0;border-radius:10px;background:#eff4ff;color:#0b1c30;padding:10px 16px;font-weight:600;cursor:pointer';
      const form = document.createElement('form');
      form.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap';
      const submit = document.createElement('button');
      submit.type = 'submit';
      submit.textContent = 'Guardar';
      submit.style.cssText = 'border:0;border-radius:10px;background:#00685f;color:#fff;padding:10px 16px;font-weight:600;cursor:pointer';
      form.append(cancel, submit);
      dialog.buttons.replaceWith(form);
      const finish = value => {
        dialog.close();
        resolve(value);
      };
      cancel.addEventListener('click', () => finish(null));
      form.addEventListener('submit', event => {
        event.preventDefault();
        const value = input.value.trim();
        if (!value) {
          input.focus();
          return;
        }
        if (inputType === 'number' && (!Number.isFinite(Number(value)) || Number(value) <= 0)) {
          input.setCustomValidity('Ingresa un importe mayor que cero.');
          input.reportValidity();
          return;
        }
        input.setCustomValidity('');
        finish(value);
      });
      input.addEventListener('keydown', event => {
        if (event.key === 'Escape') finish(null);
      });
      input.focus();
      input.select();
    });
  }

  function chooseFrom(title, message, choices) {
    return new Promise(resolve => {
      const dialog = makeDialog(title, message);
      const list = document.createElement('div');
      list.style.cssText = 'display:grid;gap:8px;margin-bottom:16px';
      choices.forEach(choice => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = choice;
        button.style.cssText = 'border:1px solid #dce9ff;border-radius:10px;background:#eff4ff;color:#0b1c30;padding:12px;text-align:left;font:600 14px Inter,Arial,sans-serif;cursor:pointer';
        button.addEventListener('click', () => {
          dialog.close();
          resolve(choice);
        });
        list.appendChild(button);
      });
      dialog.panel.insertBefore(list, dialog.buttons);
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.textContent = 'Cancelar';
      cancel.style.cssText = 'border:0;border-radius:10px;background:#eff4ff;color:#0b1c30;padding:10px 16px;font-weight:600;cursor:pointer';
      cancel.addEventListener('click', () => {
        dialog.close();
        resolve(null);
      });
      dialog.buttons.appendChild(cancel);
    });
  }

  function normalize(value) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function controlText(button) {
    return normalize((button.getAttribute('aria-label') || '') + ' ' + (button.title || '') + ' ' + button.textContent).replace(/\s+/g, ' ').trim();
  }

  function navigate(page, hash = '') {
    window.location.href = page + hash;
  }

  function setCurrentNav() {
    const current = location.pathname.toLowerCase().endsWith('capa3.html') ? 'odontograma' : 'agenda';
    document.querySelectorAll('nav[data-active-classes] a[data-path]').forEach(link => {
      const isActive = link.dataset.path === current;
      link.classList.toggle('text-primary', isActive);
      link.classList.toggle('font-bold', isActive);
      link.classList.toggle('text-on-surface-variant', !isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function renderAppointments() {
    const timeline = document.getElementById('agendaTimeline');
    if (!timeline) return;
    timeline.querySelectorAll('[data-saved-appointment]').forEach(card => card.remove());
    state.appointments.forEach(appointment => {
      const card = document.createElement('article');
      card.dataset.savedAppointment = appointment.id;
      card.dataset.chair = '1';
      card.style.cssText = 'display:flex;gap:12px;align-items:flex-start;border-radius:12px;background:#fff;padding:14px;box-shadow:0 2px 10px #0b1c3012';
      const time = document.createElement('strong');
      time.textContent = appointment.time || 'Por confirmar';
      time.style.cssText = 'min-width:58px;color:#00685f';
      const details = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = appointment.patient;
      const summary = document.createElement('p');
      summary.textContent = `${appointment.specialty} · ${appointment.procedure} · ${appointment.duration}`;
      summary.style.cssText = 'margin:5px 0;color:#3d4947';
      const date = document.createElement('small');
      date.textContent = `${appointment.date} · Sillón 1`;
      date.style.color = '#6d7a77';
      details.append(name, summary, date);
      card.append(time, details);
      timeline.appendChild(card);
    });
  }

  function filterAgenda(chair) {
    const timeline = document.getElementById('agendaTimeline');
    if (!timeline) return;
    Array.from(timeline.children).forEach(card => {
      const text = normalize(card.textContent);
      const match = text.match(/sillon\s+([123])/);
      const cardChair = card.dataset.chair || (match ? match[1] : '');
      card.hidden = chair !== 'todos' && cardChair !== chair;
    });
  }

  function setAgendaView(view) {
    const timeline = document.getElementById('agendaTimeline');
    if (!timeline) return;
    const grid = view === 'grid';
    timeline.style.display = grid ? 'grid' : 'flex';
    timeline.style.gridTemplateColumns = grid ? 'repeat(auto-fit,minmax(min(100%,320px),1fr))' : '';
    document.querySelectorAll('#viewListBtn,#viewGridBtn').forEach(button => {
      const active = button.id === (grid ? 'viewGridBtn' : 'viewListBtn');
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('bg-surface-container-lowest', active);
      button.classList.toggle('text-primary', active);
      button.classList.toggle('shadow-xs', active);
      button.classList.toggle('text-on-surface-variant', !active);
    });
  }

  function updateAppointmentSelection(container, selected, activeClasses, inactiveClasses) {
    if (!container) return;
    container.querySelectorAll('button').forEach(button => {
      const active = button === selected;
      activeClasses.forEach(className => button.classList.toggle(className, active));
      inactiveClasses.forEach(className => button.classList.toggle(className, !active));
      button.setAttribute('aria-pressed', String(active));
    });
  }

  async function handleAgendaButton(button) {
    if (button.getAttribute('aria-label') === 'Volver') return navigate('Capa1.html');
    if (button.id === 'viewListBtn') return setAgendaView('list');
    if (button.id === 'viewGridBtn') return setAgendaView('grid');
    if (button.id === 'closeDrawer') {
      document.getElementById('quickActionDrawer')?.classList.add('hidden');
      return;
    }

    const label = controlText(button);
    if (button.closest('#dateStrip')) {
      document.querySelectorAll('#dateStrip button').forEach(day => {
        day.classList.remove('bg-primary', 'text-on-primary', 'shadow-md', 'scale-105');
        day.classList.add('bg-surface-container-lowest', 'text-on-surface-variant', 'shadow-sm');
        day.setAttribute('aria-pressed', 'false');
      });
      button.classList.remove('bg-surface-container-lowest', 'text-on-surface-variant', 'shadow-sm');
      button.classList.add('bg-primary', 'text-on-primary', 'shadow-md', 'scale-105');
      button.setAttribute('aria-pressed', 'true');
      const dayName = button.querySelector('span')?.textContent.trim();
      const dayNumber = button.querySelectorAll('span')[1]?.textContent.trim();
      const dateLabel = document.querySelector('#dateStrip')?.previousElementSibling?.querySelector('span');
      if (dateLabel && dayName && dayNumber) dateLabel.textContent = `${dayName}, ${dayNumber} de Octubre`;
      return;
    }
    if (button.classList.contains('chair-filter')) {
      const chair = label.includes('sillon 1') ? '1' : label.includes('sillon 2') ? '2' : label.includes('sillon 3') ? '3' : 'todos';
      document.querySelectorAll('.chair-filter').forEach(filter => {
        const active = filter === button;
        filter.classList.toggle('active', active);
        filter.classList.toggle('bg-primary', active);
        filter.classList.toggle('text-on-primary', active);
        filter.classList.toggle('bg-surface-container-lowest', !active);
        filter.classList.toggle('text-on-surface-variant', !active);
      });
      filterAgenda(chair);
      return;
    }
    if (button.getAttribute('aria-label') === 'Nueva Cita Express') return navigate('capa2.html');
    if (button.getAttribute('aria-label') === 'Perfil Profesional') {
      return showMessage('Perfil profesional', 'Dra. Elena Rodríguez\nEspecialista en Endodoncia Microscópica\nSede Central - S1');
    }
    if (button.closest('#quickActionDrawer')) {
      if (label.includes('odontograma')) return navigate('capa3.html');
      if (label.includes('presupuesto')) return showBudgetDialog();
      if (label.includes('finalizar turno')) {
        const ok = window.confirm('¿Marcar el turno actual como completado?');
        if (ok) {
          state.turnFinished = true;
          saveState();
          const activeCard = Array.from(document.querySelectorAll('#agendaTimeline > *'))
            .find(card => normalize(card.textContent).includes('sofia alarcon'));
          const status = activeCard && Array.from(activeCard.querySelectorAll('span'))
            .find(span => normalize(span.textContent).includes('en sillon'));
          if (status) status.textContent = 'Turno finalizado';
          document.getElementById('quickActionDrawer')?.classList.add('hidden');
          showToast('Turno finalizado.');
        }
        return;
      }
      if (label.includes('proxima cita')) return navigate('capa2.html');
    }
    if (button.title === 'Ver Odontograma' || button.title === 'Ver Odontograma completo') return navigate('capa3.html');
    if (label.includes('evolucion')) return navigate('capa3.html', '#history');
    if (label.includes('comprobante pagado') || label.includes('s/ 120')) {
      return showMessage('Comprobante de pago', 'Pago registrado: S/ 120.00\nPaciente: Carlos Méndez\nConcepto: Limpieza y profilaxis');
    }
    if (label.includes('ver box')) {
      document.getElementById('quickActionDrawer')?.classList.remove('hidden');
      return;
    }
    if (label.includes('llamar asistente')) {
      state.assistanceRequests.push({ patient: 'Sofía Alarcón', createdAt: new Date().toISOString() });
      if (saveState()) showMessage('Asistente de clínica', 'La solicitud quedó registrada en este navegador. No se envió una notificación externa.');
      return;
    }
    if (label.includes('hacer pasar')) {
      button.textContent = 'En sillón';
      button.disabled = true;
      button.classList.remove('bg-primary-fixed');
      button.classList.add('bg-surface-container');
      if (!state.arrivals.some(arrival => arrival.patient === 'Mateo Gómez' && arrival.status === 'En sillón')) {
        state.arrivals.push({ patient: 'Mateo Gómez', status: 'En sillón', time: new Date().toISOString() });
      }
      saveState();
      return showToast('Mateo Gómez pasó al sillón.');
    }
    if (label.includes('fotos de control')) {
      const picker = document.createElement('input');
      picker.type = 'file';
      picker.accept = 'image/*';
      picker.addEventListener('change', () => {
        if (picker.files?.[0]) showToast(`Imagen seleccionada: ${picker.files[0].name}`);
      });
      picker.click();
      return;
    }
    if (label.includes('recetar profilaxis')) {
      const prescription = await askForValue('Registrar profilaxis', 'Indica el medicamento o la pauta que se debe registrar.');
      if (prescription) {
        state.prescriptions.push({ patient: 'Roberto Vega', instruction: prescription, createdAt: new Date().toISOString() });
        if (saveState()) showMessage('Receta registrada', prescription);
      }
      return;
    }
    if (label.includes('chat')) return showMessage('Mensajes', 'No hay un número de contacto configurado para este paciente.');
    if (label.includes('emitir presupuesto')) return showBudgetDialog();
    if (label.includes('abrir odontograma')) return navigate('capa3.html');
    if (label.includes('finanzas')) return showFinanceDialog();
  }

  async function showBudgetDialog() {
    const amount = await askForValue('Nuevo presupuesto', 'Importe del presupuesto en S/.', '', 'number');
    if (!amount) return;
    state.budgets.push({ amount: Number(amount), createdAt: new Date().toISOString() });
    if (saveState()) showToast('Presupuesto guardado en este navegador.');
  }

  async function showFinanceDialog() {
    const amount = await askForValue('Registrar pago', 'Importe recibido en S/.', '', 'number');
    if (!amount) return;
    state.payments.push({ amount: Number(amount), createdAt: new Date().toISOString() });
    const total = state.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    if (saveState()) showMessage('Finanzas', `Pago registrado: S/ ${Number(amount).toFixed(2)}\nTotal de pagos registrados en este navegador: S/ ${total.toFixed(2)}`);
  }

  async function addPatient() {
    const name = await askForValue('Nuevo paciente', 'Nombre completo del paciente.');
    if (!name) return null;
    const dni = await askForValue('Datos del paciente', 'DNI (opcional).');
    const patient = { name, dni: dni || '', createdAt: new Date().toISOString() };
    state.patients.push(patient);
    saveState();
    return patient;
  }

  async function changeAppointmentPatient() {
    const patients = ['Sofía Alarcón Morales', 'Carlos Méndez', 'Mateo Gómez', ...state.patients.map(patient => patient.name)];
    const choice = await chooseFrom('Seleccionar paciente', 'Elige un paciente o crea uno nuevo.', [...new Set([...patients, 'Crear nuevo paciente'])]);
    if (!choice) return;
    const name = choice === 'Crear nuevo paciente' ? (await addPatient())?.name : choice;
    if (!name) return;
    const heading = document.getElementById('appointmentPatientName');
    if (heading) heading.textContent = name;
    state.currentPatient = name;
    saveState();
  }

  function updateProcedure(specialty) {
    const names = {
      endodoncia: ['Endodoncia Molar', 'Sesión 3 - Obturación final de conductos'],
      general: ['Limpieza y profilaxis', 'Profilaxis dental ultrasónica'],
      ortodoncia: ['Control de ortodoncia', 'Ajuste y revisión de aparatología'],
      cirugia: ['Cirugía oral', 'Evaluación y procedimiento quirúrgico'],
      estetica: ['Blanqueamiento dental', 'Sesión de estética dental'],
      periodoncia: ['Tratamiento periodontal', 'Raspado y alisado radicular']
    };
    const details = names[normalize(specialty).replace(/\s+/g, '')] || names.endodoncia;
    const picker = document.getElementById('procedure-picker');
    if (!picker) return;
    const text = picker.querySelectorAll('p');
    if (text[0]) text[0].textContent = details[0];
    if (text[1]) text[1].textContent = details[1];
    state.currentSpecialty = specialty;
  }

  function initAppointment() {
    const patientName = document.getElementById('appointmentPatientName');
    if (patientName && state.currentPatient) patientName.textContent = state.currentPatient;
    document.querySelectorAll('#appointmentSpecialties button').forEach(button => {
      button.addEventListener('click', () => {
        updateAppointmentSelection(
          document.getElementById('appointmentSpecialties'),
          button,
          ['bg-primary', 'text-on-primary', 'shadow-sm'],
          ['bg-surface-container-high', 'text-on-surface']
        );
        updateProcedure(button.textContent.trim());
      });
    });
    document.querySelectorAll('#appointmentDurations button').forEach(button => {
      button.addEventListener('click', () => updateAppointmentSelection(
        document.getElementById('appointmentDurations'),
        button,
        ['bg-primary-container', 'text-on-primary-container', 'shadow-sm'],
        ['bg-surface-container-high', 'text-on-surface']
      ));
    });
    document.querySelectorAll('#appointmentTimes button').forEach(button => {
      button.addEventListener('click', () => updateAppointmentSelection(
        document.getElementById('appointmentTimes'),
        button,
        ['bg-primary-container', 'text-on-primary-container', 'font-semibold', 'shadow-sm'],
        ['bg-surface-container-high', 'text-on-surface']
      ));
    });
    document.querySelectorAll('#appointmentCalendar button').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('#appointmentCalendar button').forEach(day => {
          day.classList.remove('bg-primary', 'text-on-primary', 'shadow-sm');
          day.classList.add('bg-surface-container-low');
        });
        button.classList.remove('bg-surface-container-low');
        button.classList.add('bg-primary', 'text-on-primary', 'shadow-sm');
        const day = button.querySelectorAll('span')[1]?.textContent.trim();
        const dayName = button.querySelector('span')?.textContent.trim();
        const selectedLabel = document.querySelector('#appointmentCalendar')?.nextElementSibling?.querySelector('.text-primary');
        if (selectedLabel && day && dayName) selectedLabel.textContent = `${dayName}, ${day} Feb`;
        state.currentDate = `${dayName || ''} ${day || ''} Febrero 2025`;
      });
    });

    const reminder = document.getElementById('reminder-toggle');
    reminder?.addEventListener('click', () => {
      const enabled = reminder.getAttribute('aria-pressed') !== 'true';
      reminder.setAttribute('aria-pressed', String(enabled));
      reminder.classList.toggle('bg-primary', enabled);
      reminder.classList.toggle('bg-secondary', !enabled);
      reminder.firstElementChild?.classList.toggle('translate-x-6', enabled);
    });

    document.getElementById('confirm-btn')?.addEventListener('click', event => {
      const confirmButton = event.currentTarget;
      if (confirmButton.disabled) return;
      const specialty = document.querySelector('#appointmentSpecialties button.bg-primary')?.textContent.trim() || 'Endodoncia';
      const duration = document.querySelector('#appointmentDurations button.bg-primary-container')?.textContent.trim() || '45m';
      const time = document.querySelector('#appointmentTimes button.bg-primary-container')?.textContent.trim().replace(/^check\s*/i, '') || '10:00 AM';
      const notes = document.querySelector('textarea')?.value.trim() || '';
      const appointment = {
        id: `${Date.now()}`,
        patient: document.getElementById('appointmentPatientName')?.textContent.trim() || 'Sofía Alarcón Morales',
        specialty,
        procedure: document.querySelector('#procedure-picker p')?.textContent.trim() || 'Consulta general',
        duration,
        date: state.currentDate || 'Jueves 20 Febrero 2025',
        time,
        reminder: reminder?.getAttribute('aria-pressed') === 'true',
        notes
      };
      state.appointments.push(appointment);
      confirmButton.disabled = true;
      confirmButton.textContent = 'Guardando cita...';
      if (saveState()) {
        showToast('Cita agendada correctamente.');
        window.setTimeout(() => navigate('Capa1.html'), 650);
      } else {
        state.appointments.pop();
        confirmButton.disabled = false;
        confirmButton.textContent = 'Confirmar y Agendar Cita';
      }
    });
  }

  function updateChartTab(tab) {
    const sections = {
      odontogram: document.getElementById('chartOdontogram'),
      toothDetail: document.getElementById('chartToothDetail'),
      history: document.getElementById('chartHistory'),
      radiographs: document.getElementById('chartRadiograph'),
      budgets: null
    };
    document.querySelectorAll('[data-chart-tab]').forEach(button => {
      const active = button.dataset.chartTab === tab;
      button.classList.toggle('bg-primary', active);
      button.classList.toggle('text-on-primary', active);
      button.classList.toggle('shadow-sm', active);
      button.classList.toggle('bg-surface-container-lowest', !active);
      button.classList.toggle('text-on-surface-variant', !active);
      button.setAttribute('aria-pressed', String(active));
    });
    Object.entries(sections).forEach(([key, section]) => {
      if (section) section.hidden = key !== 'toothDetail' && key !== tab;
      if (section && key === 'toothDetail') section.hidden = tab !== 'odontogram';
    });
    if (tab === 'budgets') {
      const budgets = state.budgets.length
        ? state.budgets.map(budget => `S/ ${Number(budget.amount).toFixed(2)}`).join('\n')
        : 'Aún no hay presupuestos registrados.';
      showMessage('Presupuestos del paciente', budgets);
    }
  }

  function selectTooth(button) {
    document.querySelectorAll('.tooth-selector').forEach(tooth => {
      tooth.classList.remove('ring-2', 'ring-primary', 'bg-primary-fixed', 'scale-105');
      tooth.classList.add('bg-surface-container-low');
      const label = tooth.querySelector('span');
      if (label) label.classList.remove('font-bold', 'text-primary');
    });
    button.classList.remove('bg-surface-container-low');
    button.classList.add('ring-2', 'ring-primary', 'bg-primary-fixed', 'scale-105');
    const label = button.querySelector('span');
    if (label) label.classList.add('font-bold', 'text-primary');
    state.selectedTooth = label?.textContent.trim() || state.selectedTooth;
    const title = document.getElementById('selectedToothTitle');
    const number = document.getElementById('selectedToothDescription');
    const toothNumber = document.getElementById('selectedToothNumber');
    if (title) title.textContent = `Pieza dental ${state.selectedTooth}`;
    if (number) number.textContent = `FDI #${state.selectedTooth} · Pieza seleccionada`;
    if (toothNumber) toothNumber.textContent = state.selectedTooth;
    const noteButton = Array.from(document.querySelectorAll('#chartToothDetail button'))
      .find(control => normalize(control.textContent).includes('anadir nota'));
    if (noteButton?.lastElementChild) {
      noteButton.lastElementChild.textContent = `Añadir nota de evolución para Pieza ${state.selectedTooth}`;
    }
    saveState();
  }

  function renderChartUpdates() {
    const container = document.getElementById('chartUpdates');
    if (!container) return;
    container.replaceChildren();
    [...state.findings, ...state.notes]
      .sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)))
      .forEach(entry => {
        const item = document.createElement('p');
        item.textContent = `${entry.tooth ? `Pieza ${entry.tooth} · ` : ''}${entry.text}`;
        item.style.cssText = 'margin:0;padding:8px 10px;border-radius:8px;background:#eff4ff;color:#0b1c30;font:12px/1.5 Inter,Arial,sans-serif';
        container.appendChild(item);
      });
  }

  async function handleChartButton(button) {
    const label = controlText(button);
    if (button.getAttribute('aria-label') === 'Nueva Cita Express') return navigate('capa2.html');
    if (button.getAttribute('aria-label') === 'Perfil Profesional') {
      return showMessage('Perfil profesional', 'Dra. Elena Rodríguez\nEspecialista en Endodoncia Microscópica\nSede Central - S1');
    }
    if (button.getAttribute('aria-label') === 'Llamar o contactar') {
      return showMessage('Contacto del paciente', 'No hay un teléfono registrado en esta ficha para iniciar una llamada.');
    }
    if (button.dataset.chartTab) {
      if (button.dataset.chartTab === 'budgets') return updateChartTab('budgets');
      return updateChartTab(button.dataset.chartTab);
    }
    if (button.classList.contains('tooth-selector')) {
      selectTooth(button);
      return;
    }
    if (button.closest('#dentitionSwitch')) {
      button.parentElement.querySelectorAll('button').forEach(option => {
        const active = option === button;
        option.classList.toggle('bg-surface-container-lowest', active);
        option.classList.toggle('text-primary', active);
        option.classList.toggle('shadow-xs', active);
        option.classList.toggle('text-on-surface-variant/70', !active);
      });
      const heading = document.querySelector('#chartOdontogram h2');
      if (heading) heading.textContent = `Odontograma ${button.textContent.trim()} FDI`;
      return showToast(`Vista ${button.textContent.trim().toLowerCase()} seleccionada.`);
    }
    if (label.includes('registrar hallazgo')) {
      const finding = await askForValue('Registrar hallazgo', `Describe el hallazgo para la pieza ${state.selectedTooth}.`);
      if (finding) {
        state.findings.push({ tooth: state.selectedTooth, text: finding, createdAt: new Date().toISOString() });
        if (saveState()) {
          renderChartUpdates();
          showToast(`Hallazgo guardado para la pieza ${state.selectedTooth}.`);
        }
      }
      return;
    }
    if (label.includes('ver rx periapical') || label.includes('expandir visor')) {
      return showMessage('Radiografía periapical', `Visor clínico de la pieza ${state.selectedTooth}. Longitud de trabajo: Palatino 21.5 mm, MV1 20 mm, MV2 19.5 mm y DV 20 mm.`);
    }
    if (label.includes('añadir nota') || label.includes('anadir nota')) {
      const note = await askForValue('Nota de evolución', `Escribe una nota para la pieza ${state.selectedTooth}.`);
      if (note) {
        state.notes.push({ tooth: state.selectedTooth, text: note, createdAt: new Date().toISOString() });
        if (saveState()) {
          renderChartUpdates();
          showToast('Nota clínica guardada.');
        }
      }
      return;
    }
    if (button.id === 'saveRecordBtn') {
      state.updatedAt = new Date().toISOString();
      if (saveState()) showToast('Evolución y odontograma guardados en este navegador.');
      return;
    }
    if (label.includes('finanzas')) return showFinanceDialog();
  }

  async function handleLink(link, event) {
    const path = link.dataset.path;
    if (!path) return;
    event.preventDefault();
    if (path === 'agenda') return navigate('Capa1.html');
    if (path === 'odontograma') return navigate('capa3.html');
    if (path === 'pacientes') return navigate('capa3.html', '#history');
    if (path === 'finanzas') return showFinanceDialog();
  }

  function initChart() {
    document.querySelectorAll('.tooth-selector').forEach(button => {
      if (button.querySelector('span')?.textContent.trim() === String(state.selectedTooth)) selectTooth(button);
    });
    const hashTab = location.hash === '#history' ? 'history' : null;
    updateChartTab(hashTab || 'odontogram');
    renderChartUpdates();
    if (hashTab) document.getElementById('chartHistory')?.scrollIntoView({ block: 'start' });
  }

  readState();
  setCurrentNav();
  renderAppointments();
  initAgenda();
  initAppointment();
  initChart();
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-path]');
    if (link) {
      handleLink(link, event);
      return;
    }
    const phoneLink = event.target.closest('a[href^="tel:"]');
    if (phoneLink) {
      event.preventDefault();
      showMessage('Teléfono no configurado', 'El número mostrado en esta cita es un dato de ejemplo. No se inició ninguna llamada.');
      return;
    }
    const button = event.target.closest('button');
    if (!button) return;
    if (button.getAttribute('aria-label') === 'Volver') {
      navigate('Capa1.html');
      return;
    }
    if (document.getElementById('agendaTimeline')) handleAgendaButton(button);
    if (document.getElementById('appointmentCalendar')) {
      const label = controlText(button);
      if (label.includes('cambiar paciente')) changeAppointmentPatient();
      if (label.includes('crear nuevo paciente')) {
        addPatient().then(patient => {
          if (!patient) return;
          const heading = document.getElementById('appointmentPatientName');
          if (heading) heading.textContent = patient.name;
          state.currentPatient = patient.name;
          saveState();
        });
      }
      if (button.id === 'procedure-picker') {
        chooseFrom('Seleccionar procedimiento', 'Elige el procedimiento para la cita.', [
          'Endodoncia Molar — Obturación final de conductos',
          'Endodoncia premolar — Instrumentación de conductos',
          'Consulta y diagnóstico — Evaluación clínica'
        ]).then(choice => {
          if (!choice) return;
          const [name, description] = choice.split(' — ');
          const fields = button.querySelectorAll('p');
          if (fields[0]) fields[0].textContent = name;
          if (fields[1]) fields[1].textContent = description;
          state.currentProcedure = name;
        });
      }
    }
    if (document.getElementById('chartOdontogram')) handleChartButton(button);
  });
})();
