import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SubirTramiteForm } from './SubirTramiteForm';
import { getTiposTramite, crearTramite } from '../../services/tramitesService';
import { validarArchivoTramite } from '../../utils/formValidators';

jest.mock('../../services/tramitesService', () => ({
  getTiposTramite: jest.fn(),
  crearTramite: jest.fn(),
}));
jest.mock('../../utils/formValidators', () => ({
  validarArchivoTramite: jest.fn(),
}));

const TIPO_SIN_VENCIMIENTO = { id: 1, nombre: 'Declaración jurada', requiere_vencimiento: false };
const TIPO_CON_VENCIMIENTO = { id: 2, nombre: 'Apto médico', requiere_vencimiento: true };

class MockFileReader {
  readAsDataURL(file) {
    this.result = `data:${file.type};base64,AAAA`;
    if (this.onload) this.onload();
  }
}

function crearArchivo(name = 'archivo.pdf', type = 'application/pdf') {
  return new File(['contenido'], name, { type });
}

describe('SubirTramiteForm', () => {
  const onClose = jest.fn();
  const onCreado = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    getTiposTramite.mockResolvedValue([TIPO_SIN_VENCIMIENTO, TIPO_CON_VENCIMIENTO]);
    validarArchivoTramite.mockReturnValue(undefined);
    global.FileReader = MockFileReader;
  });

  test('carga y muestra los tipos de trámite', async () => {
    render(<SubirTramiteForm idSocio="socio-1" onClose={onClose} onCreado={onCreado} />);
    await screen.findByRole('option', { name: 'Apto médico' });
    expect(screen.getByRole('option', { name: 'Declaración jurada' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Apto médico' })).toBeInTheDocument();
  });

  test('no muestra el aviso de vencimiento si el tipo no lo requiere', async () => {
    render(<SubirTramiteForm idSocio="socio-1" onClose={onClose} onCreado={onCreado} />);
    await screen.findByRole('option', { name: 'Apto médico' });
    fireEvent.change(screen.getByLabelText('Tipo de trámite'), { target: { value: '1' } });
    expect(screen.queryByText('Este trámite vence al año de ser cargado.')).not.toBeInTheDocument();
  });

  test('muestra el aviso de vencimiento si el tipo lo requiere', async () => {
    render(<SubirTramiteForm idSocio="socio-1" onClose={onClose} onCreado={onCreado} />);
    await screen.findByRole('option', { name: 'Apto médico' });
    fireEvent.change(screen.getByLabelText('Tipo de trámite'), { target: { value: '2' } });
    expect(screen.getByText('Este trámite vence al año de ser cargado.')).toBeInTheDocument();
  });

  test('el botón Enviar está deshabilitado sin tipo ni archivo', async () => {
    render(<SubirTramiteForm idSocio="socio-1" onClose={onClose} onCreado={onCreado} />);
    await screen.findByRole('option', { name: 'Apto médico' });
    expect(screen.getByRole('button', { name: /enviar/i })).toBeDisabled();
  });

  test('muestra un error de validación si el archivo no es válido', async () => {
    validarArchivoTramite.mockReturnValue('Solo se permiten archivos JPG, PNG, WEBP o PDF');
    render(<SubirTramiteForm idSocio="socio-1" onClose={onClose} onCreado={onCreado} />);
    await screen.findByRole('option', { name: 'Apto médico' });

    const input = screen.getByLabelText('Adjuntar archivo del trámite');
    fireEvent.change(input, { target: { files: [crearArchivo('malware.exe', 'application/exe')] } });

    expect(await screen.findByText('Solo se permiten archivos JPG, PNG, WEBP o PDF')).toBeInTheDocument();
  });

  test('envía el trámite y llama a onCreado tras adjuntar un tipo sin vencimiento y un archivo válido', async () => {
    crearTramite.mockResolvedValue({ id: 't-1', estado: 'en_revision' });
    render(<SubirTramiteForm idSocio="socio-1" onClose={onClose} onCreado={onCreado} />);
    await screen.findByRole('option', { name: 'Apto médico' });

    fireEvent.change(screen.getByLabelText('Tipo de trámite'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Adjuntar archivo del trámite'), {
      target: { files: [crearArchivo()] },
    });

    await waitFor(() => expect(screen.getByRole('button', { name: /enviar/i })).not.toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(crearTramite).toHaveBeenCalledWith('socio-1', {
        id_tipo_tramite: 1,
        archivo_base64: 'data:application/pdf;base64,AAAA',
      });
      expect(onCreado).toHaveBeenCalledWith({ id: 't-1', estado: 'en_revision' });
    });
  });

  test('habilita Enviar con un tipo que requiere vencimiento en cuanto se adjunta el archivo (sin pedir fecha)', async () => {
    render(<SubirTramiteForm idSocio="socio-1" onClose={onClose} onCreado={onCreado} />);
    await screen.findByRole('option', { name: 'Apto médico' });

    fireEvent.change(screen.getByLabelText('Tipo de trámite'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Adjuntar archivo del trámite'), {
      target: { files: [crearArchivo()] },
    });

    await waitFor(() => expect(screen.getByRole('button', { name: /enviar/i })).not.toBeDisabled());
  });

  test('muestra un mensaje de error si crearTramite falla por tamaño', async () => {
    crearTramite.mockRejectedValue(new Error('archivo-muy-grande'));
    render(<SubirTramiteForm idSocio="socio-1" onClose={onClose} onCreado={onCreado} />);
    await screen.findByRole('option', { name: 'Apto médico' });

    fireEvent.change(screen.getByLabelText('Tipo de trámite'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Adjuntar archivo del trámite'), {
      target: { files: [crearArchivo()] },
    });
    await waitFor(() => expect(screen.getByRole('button', { name: /enviar/i })).not.toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    expect(await screen.findByText('El archivo no puede superar los 10MB.')).toBeInTheDocument();
  });

  test('llama a onClose al hacer click en Cancelar', async () => {
    render(<SubirTramiteForm idSocio="socio-1" onClose={onClose} onCreado={onCreado} />);
    await screen.findByRole('option', { name: 'Apto médico' });
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
